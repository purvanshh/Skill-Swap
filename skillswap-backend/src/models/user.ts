import { firestore } from '../config/firebase';
import { User, CreateUserRequest, UpdateProfileRequest } from '../types';
import { logger } from '../utils/logger';
import { FieldValue } from 'firebase-admin/firestore';

const USERS_COLLECTION = 'users';

export class UserModel {
  // Create a new user
  static async create(userData: CreateUserRequest & { uid: string }): Promise<User> {
    try {
      const {
        uid,
        name,
        email,
        avatar_url = null,
        role = 'student',
        skills_offered = [],
        skills_wanted = [],
        availability = { days: [], times: [] }
      } = userData;

      const userDoc = {
        uid,
        name,
        email,
        avatar_url,
        role,
        skills_offered,
        skills_wanted,
        availability,
        badge_count: 0,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      };

      await firestore.collection(USERS_COLLECTION).doc(uid).set(userDoc);

      logger.info(`✅ User created: ${uid}`);
      
      // Return the created user (with timestamps as dates for consistency)
      const createdUser = {
        ...userDoc,
        created_at: new Date(),
        updated_at: new Date()
      } as User;
      
      return createdUser;
    } catch (error) {
      logger.error(`❌ Failed to create user:`, error);
      throw error;
    }
  }

  // Find user by UID
  static async findByUid(uid: string): Promise<User | null> {
    try {
      const userDoc = await firestore.collection(USERS_COLLECTION).doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      if (!userData) {
        return null;
      }

      return { uid: userDoc.id, ...userData } as User;
    } catch (error) {
      logger.error(`❌ Failed to find user by UID ${uid}:`, error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const querySnapshot = await firestore
        .collection(USERS_COLLECTION)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      if (!userData) {
        return null;
      }

      return { uid: userDoc.id, ...userData } as User;
    } catch (error) {
      logger.error(`❌ Failed to find user by email ${email}:`, error);
      throw error;
    }
  }

  // Update user profile
  static async update(uid: string, updateData: UpdateProfileRequest): Promise<User> {
    try {
      const updateFields: any = {};
      
      // Only add fields that are not undefined
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields[key] = value;
        }
      });

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated timestamp
      updateFields.updated_at = FieldValue.serverTimestamp();

      const userDocRef = firestore.collection(USERS_COLLECTION).doc(uid);
      
      // Check if user exists
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      await userDocRef.update(updateFields);

      // Get updated user data
      const updatedDoc = await userDocRef.get();
      const updatedData = updatedDoc.data();
      
      if (!updatedData) {
        throw new Error('Failed to retrieve updated user data');
      }

      const updatedUser = { uid: updatedDoc.id, ...updatedData } as User;

      logger.info(`✅ User updated: ${uid}`);
      return updatedUser;
    } catch (error) {
      logger.error(`❌ Failed to update user ${uid}:`, error);
      throw error;
    }
  }

  // Get all users for matching (with pagination)
  static async getAllForMatching(excludeUid: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      let query = firestore
        .collection(USERS_COLLECTION)
        .where('uid', '!=', excludeUid)
        .orderBy('uid') // Required for != queries
        .orderBy('badge_count', 'desc')
        .limit(limit);

      // Firestore doesn't support offset directly, but we can use startAfter with cursor
      // For now, we'll use a simple offset approach (not ideal for large datasets)
      if (offset > 0) {
        const offsetQuery = firestore
          .collection(USERS_COLLECTION)
          .where('uid', '!=', excludeUid)
          .orderBy('uid')
          .orderBy('badge_count', 'desc')
          .limit(offset);
        
        const offsetSnapshot = await offsetQuery.get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const querySnapshot = await query.get();
      
      const users: User[] = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          uid: userData.uid,
          name: userData.name,
          skills_offered: userData.skills_offered,
          skills_wanted: userData.skills_wanted,
          availability: userData.availability,
          badge_count: userData.badge_count
        } as User);
      });

      return users;
    } catch (error) {
      logger.error(`❌ Failed to get users for matching:`, error);
      throw error;
    }
  }

  // Delete user (for admin use)
  static async delete(uid: string): Promise<boolean> {
    try {
      const userDocRef = firestore.collection(USERS_COLLECTION).doc(uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return false;
      }

      await userDocRef.delete();
      logger.info(`✅ User deleted: ${uid}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete user ${uid}:`, error);
      throw error;
    }
  }

  // Update badge count
  static async updateBadgeCount(uid: string, increment: number = 1): Promise<void> {
    try {
      const userDocRef = firestore.collection(USERS_COLLECTION).doc(uid);
      
      await userDocRef.update({
        badge_count: FieldValue.increment(increment)
      });

      logger.info(`✅ Badge count updated for user: ${uid} (+${increment})`);
    } catch (error) {
      logger.error(`❌ Failed to update badge count for ${uid}:`, error);
      throw error;
    }
  }

  // Get user statistics
  static async getStats(): Promise<any> {
    try {
      const usersSnapshot = await firestore.collection(USERS_COLLECTION).get();
      
      let totalUsers = 0;
      let students = 0;
      let mentors = 0;
      let totalBadges = 0;
      let newUsersWeek = 0;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        totalUsers++;
        
        if (userData.role === 'student') students++;
        if (userData.role === 'mentor') mentors++;
        
        totalBadges += userData.badge_count || 0;
        
        // Check if created in last week
        const createdAt = userData.created_at?.toDate();
        if (createdAt && createdAt >= oneWeekAgo) {
          newUsersWeek++;
        }
      });

      return {
        total_users: totalUsers,
        students,
        mentors,
        avg_badges: totalUsers > 0 ? totalBadges / totalUsers : 0,
        new_users_week: newUsersWeek
      };
    } catch (error) {
      logger.error(`❌ Failed to get user stats:`, error);
      throw error;
    }
  }
}