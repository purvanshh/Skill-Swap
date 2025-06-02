import { Request, Response, NextFunction } from 'express';
import { firestore } from '../config/firebase';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UpdateProfileRequest } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

export class ProfileController {
  // Get current user's profile
  static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;

      // Get user from Firestore
      const userDoc = await firestore.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data()!;

      logger.info(`📖 Profile retrieved: ${uid}`);

      res.status(200).json({
        success: true,
        data: {
          user: userData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get another user's public profile
  static async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { uid } = req.params;

      // Get user from Firestore
      const userDoc = await firestore.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data()!;

      // Return only public information
      const publicProfile = {
        uid: userData.uid,
        name: userData.name,
        avatar_url: userData.avatar_url,
        role: userData.role,
        skills_offered: userData.skills_offered,
        badge_count: userData.badge_count,
        availability: userData.availability
      };

      logger.info(`📖 Public profile retrieved: ${uid}`);

      res.status(200).json({
        success: true,
        data: {
          user: publicProfile
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;
      const updateData: UpdateProfileRequest = req.body;

      // Validate that at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        throw new AppError('At least one field must be provided for update', 400);
      }

      // Get current user data first
      const userDoc = await firestore.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const currentData = userDoc.data()!;

      // Prepare update data with timestamp
      const dataToUpdate = {
        ...updateData,
        updated_at: FieldValue.serverTimestamp()
      };

      // Update user in Firestore
      await firestore.collection('users').doc(uid).update(dataToUpdate);

      // Update skill popularity if skills_offered changed
      if (updateData.skills_offered) {
        const batch = firestore.batch();
        
        // Get previous skills to decrement their count
        const previousSkills = currentData.skills_offered || [];
        const newSkills = updateData.skills_offered;

        // Decrement count for removed skills
        for (const skill of previousSkills) {
          if (!newSkills.includes(skill)) {
            const skillRef = firestore.collection('skill_popularity').doc(skill.toLowerCase());
            batch.update(skillRef, {
              count: FieldValue.increment(-1),
              updated_at: FieldValue.serverTimestamp()
            });
          }
        }

        // Increment count for new skills
        for (const skill of newSkills) {
          if (!previousSkills.includes(skill)) {
            const skillRef = firestore.collection('skill_popularity').doc(skill.toLowerCase());
            batch.set(skillRef, {
              name: skill,
              count: FieldValue.increment(1),
              updated_at: FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }

        await batch.commit();
      }

      // Clear user's cached matches since profile changed
      const cachedMatches = await firestore
        .collection('users')
        .doc(uid)
        .collection('cached_matches')
        .get();

      if (!cachedMatches.empty) {
        const batch = firestore.batch();
        cachedMatches.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Get updated user data
      const updatedUserDoc = await firestore.collection('users').doc(uid).get();
      const updatedUser = updatedUserDoc.data()!;

      logger.info(`✅ Profile updated: ${uid}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics (for admin or analytics)
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user has admin role
      if (req.user!.role !== 'admin') {
        throw new AppError('Access denied. Admin role required.', 403);
      }

      // Get user collection statistics
      const usersSnapshot = await firestore.collection('users').get();
      const totalUsers = usersSnapshot.size;

      // Count users by role
      const roleStats: { [key: string]: number } = {};
      const skillStats: { [key: string]: number } = {};

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        
        // Count by role
        const role = userData.role || 'unknown';
        roleStats[role] = (roleStats[role] || 0) + 1;

        // Count skills
        const skills = [...(userData.skills_offered || []), ...(userData.skills_wanted || [])];
        skills.forEach(skill => {
          skillStats[skill] = (skillStats[skill] || 0) + 1;
        });
      });

      // Get popular skills from skill_popularity collection
      const popularSkillsSnapshot = await firestore
        .collection('skill_popularity')
        .orderBy('count', 'desc')
        .limit(10)
        .get();

      const popularSkills = popularSkillsSnapshot.docs.map(doc => ({
        name: doc.data().name,
        count: doc.data().count
      }));

      const stats = {
        total_users: totalUsers,
        users_by_role: roleStats,
        popular_skills: popularSkills,
        total_unique_skills: Object.keys(skillStats).length
      };

      res.status(200).json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user profile
  static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;
      const targetUid = req.params.uid || uid;

      // Only allow users to delete their own profile or admins to delete any
      if (targetUid !== uid && req.user!.role !== 'admin') {
        throw new AppError('You can only delete your own profile', 403);
      }

      // Check if user exists
      const userDoc = await firestore.collection('users').doc(targetUid).get();
      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data()!;

      // Create a batch for all deletions
      const batch = firestore.batch();

      // Delete user document
      batch.delete(firestore.collection('users').doc(targetUid));

      // Delete cached matches subcollection
      const cachedMatches = await firestore
        .collection('users')
        .doc(targetUid)
        .collection('cached_matches')
        .get();

      cachedMatches.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Update skill popularity (decrement for user's offered skills)
      if (userData.skills_offered && userData.skills_offered.length > 0) {
        for (const skill of userData.skills_offered) {
          const skillRef = firestore.collection('skill_popularity').doc(skill.toLowerCase());
          batch.update(skillRef, {
            count: FieldValue.increment(-1),
            updated_at: FieldValue.serverTimestamp()
          });
        }
      }

      await batch.commit();

      logger.info(`✅ Profile deleted: ${targetUid}`);

      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update badge count (internal use or achievement system)
  static async updateBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;
      const { increment = 1 } = req.body;

      // Update badge count in Firestore
      await firestore.collection('users').doc(uid).update({
        badge_count: FieldValue.increment(increment),
        updated_at: FieldValue.serverTimestamp()
      });

      // Get updated user data
      const userDoc = await firestore.collection('users').doc(uid).get();
      const userData = userDoc.data();

      logger.info(`🏆 Badge count updated for ${uid}: +${increment}`);

      res.status(200).json({
        success: true,
        message: 'Badge count updated successfully',
        data: {
          new_badge_count: userData?.badge_count || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}