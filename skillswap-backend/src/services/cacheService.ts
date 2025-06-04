import { firestore } from '../config/firebase';
import { logger } from '../utils/logger';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export class AdvancedCacheService {
  private static readonly CACHE_COLLECTION = 'cache';
  private static readonly LEADERBOARD_COLLECTION = 'leaderboards';

  // Helper method to calculate expiration time
  private static getExpirationTime(ttl?: number): Timestamp | null {
    if (!ttl) return null;
    return Timestamp.fromMillis(Date.now() + (ttl * 1000));
  }

  // Helper method to check if cache entry is expired
  private static isExpired(expiresAt: Timestamp | null): boolean {
    if (!expiresAt) return false;
    return Date.now() > expiresAt.toMillis();
  }

  // Generic cache operations with error handling
  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const docData: any = {
        key,
        value,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      if (ttl) {
        docData.expiresAt = this.getExpirationTime(ttl);
      }

      await firestore.collection(this.CACHE_COLLECTION).doc(key).set(docData);
      logger.debug(`✅ Cache set: ${key}`);
    } catch (error) {
      logger.error(`❌ Cache set failed for ${key}:`, error);
    }
  }

  static async get(key: string): Promise<any | null> {
    try {
      const doc = await firestore.collection(this.CACHE_COLLECTION).doc(key).get();
      
      if (!doc.exists) {
        logger.debug(`📭 Cache miss: ${key}`);
        return null;
      }

      const data = doc.data()!;

      // Check if expired
      if (data.expiresAt && this.isExpired(data.expiresAt)) {
        // Delete expired entry
        await this.del(key);
        logger.debug(`⏰ Cache expired and deleted: ${key}`);
        return null;
      }

      logger.debug(`📦 Cache hit: ${key}`);
      return data.value;
    } catch (error) {
      logger.error(`❌ Cache get failed for ${key}:`, error);
      return null;
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await firestore.collection(this.CACHE_COLLECTION).doc(key).delete();
      logger.debug(`🗑️ Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`❌ Cache delete failed for ${key}:`, error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const doc = await firestore.collection(this.CACHE_COLLECTION).doc(key).get();
      
      if (!doc.exists) {
        return false;
      }

      const data = doc.data()!;
      
      // Check if expired
      if (data.expiresAt && this.isExpired(data.expiresAt)) {
        await this.del(key);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`❌ Cache exists check failed for ${key}:`, error);
      return false;
    }
  }

  // Batch operations
  static async mget(keys: string[]): Promise<any[]> {
    try {
      const promises = keys.map(key => this.get(key));
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      logger.error(`❌ Cache mget failed:`, error);
      return new Array(keys.length).fill(null);
    }
  }

  static async mset(pairs: { key: string, value: any, ttl?: number }[]): Promise<void> {
    try {
      const batch = firestore.batch();
      
      for (const { key, value, ttl } of pairs) {
        const docData: any = {
          key,
          value,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };

        if (ttl) {
          docData.expiresAt = this.getExpirationTime(ttl);
        }

        const docRef = firestore.collection(this.CACHE_COLLECTION).doc(key);
        batch.set(docRef, docData);
      }

      await batch.commit();
      logger.debug(`✅ Cache mset completed for ${pairs.length} items`);
    } catch (error) {
      logger.error(`❌ Cache mset failed:`, error);
    }
  }

  // Pattern-based operations (Firestore doesn't support exact pattern matching like Redis)
  static async deletePattern(pattern: string): Promise<void> {
    try {
      // Convert Redis-style pattern to Firestore query
      // This is a simplified implementation - for complex patterns, consider using startAt/endAt
      let query: FirebaseFirestore.Query = firestore.collection(this.CACHE_COLLECTION);

      if (pattern.includes('*')) {
        // Simple prefix matching for patterns like "user:*"
        const prefix = pattern.replace('*', '');
        query = query.where('key', '>=', prefix).where('key', '<', prefix + '\uf8ff');
      } else {
        // Exact match
        query = query.where('key', '==', pattern);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        logger.info(`🔍 No keys found matching pattern: ${pattern}`);
        return;
      }

      const batch = firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`🗑️ Deleted ${snapshot.size} keys matching pattern: ${pattern}`);
    } catch (error) {
      logger.error(`❌ Pattern delete failed for ${pattern}:`, error);
    }
  }

  // Leaderboard operations using a separate collection
  static async addToLeaderboard(leaderboard: string, member: string, score: number): Promise<void> {
    try {
      const leaderboardRef = firestore
        .collection(this.LEADERBOARD_COLLECTION)
        .doc(leaderboard)
        .collection('entries')
        .doc(member);

      await leaderboardRef.set({
        member,
        score,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      logger.debug(`🏆 Added to leaderboard ${leaderboard}: ${member} (${score})`);
    } catch (error) {
      logger.error(`❌ Leaderboard add failed:`, error);
    }
  }

  static async getLeaderboard(leaderboard: string, start: number = 0, end: number = 9): Promise<any[]> {
    try {
      const limit = end - start + 1;
      
      const snapshot = await firestore
        .collection(this.LEADERBOARD_COLLECTION)
        .doc(leaderboard)
        .collection('entries')
        .orderBy('score', 'desc')
        .offset(start)
        .limit(limit)
        .get();

      const results = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          member: data.member,
          score: data.score,
          rank: start + index + 1
        };
      });

      return results;
    } catch (error) {
      logger.error(`❌ Leaderboard get failed:`, error);
      return [];
    }
  }

  // Additional utility methods for Firestore-specific operations

  // Clean up expired cache entries (should be run periodically)
  static async cleanupExpired(): Promise<void> {
    try {
      const now = Timestamp.now();
      const expiredQuery = firestore
        .collection(this.CACHE_COLLECTION)
        .where('expiresAt', '<=', now);

      const snapshot = await expiredQuery.get();
      
      if (snapshot.empty) {
        logger.debug('🧹 No expired cache entries found');
        return;
      }

      const batch = firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`🧹 Cleaned up ${snapshot.size} expired cache entries`);
    } catch (error) {
      logger.error(`❌ Cache cleanup failed:`, error);
    }
  }

  // Get cache statistics
  static async getCacheStats(): Promise<{
    totalEntries: number,
    expiredEntries: number,
    activeEntries: number
  }> {
    try {
      const allEntries = await firestore.collection(this.CACHE_COLLECTION).get();
      const now = Timestamp.now();
      
      let expiredCount = 0;
      allEntries.docs.forEach(doc => {
        const data = doc.data();
        if (data.expiresAt && data.expiresAt <= now) {
          expiredCount++;
        }
      });

      return {
        totalEntries: allEntries.size,
        expiredEntries: expiredCount,
        activeEntries: allEntries.size - expiredCount
      };
    } catch (error) {
      logger.error(`❌ Cache stats failed:`, error);
      return { totalEntries: 0, expiredEntries: 0, activeEntries: 0 };
    }
  }

  // Update TTL for existing cache entry
  static async updateTTL(key: string, ttl: number): Promise<void> {
    try {
      const docRef = firestore.collection(this.CACHE_COLLECTION).doc(key);
      const doc = await docRef.get();

      if (!doc.exists) {
        logger.debug(`📭 Cache entry not found for TTL update: ${key}`);
        return;
      }

      await docRef.update({
        expiresAt: this.getExpirationTime(ttl),
        updatedAt: FieldValue.serverTimestamp()
      });

      logger.debug(`⏰ TTL updated for: ${key}`);
    } catch (error) {
      logger.error(`❌ TTL update failed for ${key}:`, error);
    }
  }

  // Get leaderboard member rank
  static async getLeaderboardRank(leaderboard: string, member: string): Promise<number | null> {
    try {
      const memberDoc = await firestore
        .collection(this.LEADERBOARD_COLLECTION)
        .doc(leaderboard)
        .collection('entries')
        .doc(member)
        .get();

      if (!memberDoc.exists) {
        return null;
      }

      const memberScore = memberDoc.data()!.score;

      // Count how many members have a higher score
      const higherScoreQuery = await firestore
        .collection(this.LEADERBOARD_COLLECTION)
        .doc(leaderboard)
        .collection('entries')
        .where('score', '>', memberScore)
        .get();

      return higherScoreQuery.size + 1; // Rank is 1-based
    } catch (error) {
      logger.error(`❌ Leaderboard rank lookup failed:`, error);
      return null;
    }
  }

  // Remove member from leaderboard
  static async removeFromLeaderboard(leaderboard: string, member: string): Promise<void> {
    try {
      await firestore
        .collection(this.LEADERBOARD_COLLECTION)
        .doc(leaderboard)
        .collection('entries')
        .doc(member)
        .delete();

      logger.debug(`🗑️ Removed from leaderboard ${leaderboard}: ${member}`);
    } catch (error) {
      logger.error(`❌ Leaderboard removal failed:`, error);
    }
  }
}