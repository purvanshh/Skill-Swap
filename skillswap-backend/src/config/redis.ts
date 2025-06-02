import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

// Initialize Redis client with Upstash
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Test Redis connection
export async function connectRedis(): Promise<void> {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      logger.info('⚡ Redis connected successfully');
    } else {
      throw new Error('Redis ping failed');
    }
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
}

// Redis utility functions for caching
export class CacheService {
  // Cache user profile with TTL
  static async setUserProfile(uid: string, profile: any, ttl: number = 86400): Promise<void> {
    try {
      await redis.set(`user:${uid}`, JSON.stringify(profile), { ex: ttl });
      logger.info(`✅ Cached user profile: ${uid}`);
    } catch (error) {
      logger.error(`❌ Failed to cache user profile ${uid}:`, error);
    }
  }

  // Get cached user profile
  static async getUserProfile(uid: string): Promise<any | null> {
    try {
      const cached = await redis.get(`user:${uid}`);
      if (cached) {
        logger.info(`📦 Retrieved cached profile: ${uid}`);
        if (typeof cached === 'string') {
          const parsed = JSON.parse(cached);
          return Array.isArray(parsed) ? parsed : null;
        }
        return Array.isArray(cached) ? cached : null;
      }
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get cached profile ${uid}:`, error);
      return null;
    }
  }

  // Cache user matches with TTL
  static async setUserMatches(uid: string, matches: any[], ttl: number = 3600): Promise<void> {
    try {
      await redis.set(`matches:${uid}`, JSON.stringify(matches), { ex: ttl });
      logger.info(`✅ Cached matches for user: ${uid}`);
    } catch (error) {
      logger.error(`❌ Failed to cache matches for ${uid}:`, error);
    }
  }

  // Get cached user matches
  static async getUserMatches(uid: string): Promise<any[] | null> {
    try {
      const cached = await redis.get(`matches:${uid}`);
      if (cached) {
        logger.info(`📦 Retrieved cached matches: ${uid}`);
        if (typeof cached === 'string') {
          const parsed = JSON.parse(cached);
          return Array.isArray(parsed) ? parsed : null;
        }
        return Array.isArray(cached) ? cached : null;
      }
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get cached matches ${uid}:`, error);
      return null;
    }
  }

  // Increment skill popularity counter
  static async incrementSkillPopularity(skill: string): Promise<void> {
    try {
      await redis.zincrby('popular_skills', 1, skill);
      logger.info(`📈 Incremented popularity for skill: ${skill}`);
    } catch (error) {
      logger.error(`❌ Failed to increment skill popularity ${skill}:`, error);
    }
  }

  // Rate limiting check
  static async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, window);
      }
      return current <= limit;
    } catch (error) {
      logger.error(`❌ Rate limit check failed for ${key}:`, error);
      return true; // Allow request if Redis fails
    }
  }
}

export default redis;