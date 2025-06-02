import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Test Redis connection
export async function connectRedis(): Promise<void> {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      logger.info('⚡ Upstash Redis connected successfully');
      
      // Test basic operations
      await redis.set('_health_check', 'ok', { ex: 10 });
      const testResult = await redis.get('_health_check');
      
      if (testResult === 'ok') {
        logger.info('📦 Upstash Redis operations test passed');
        await redis.del('_health_check');
      } else {
        throw new Error('Redis operations test failed');
      }
    } else {
      throw new Error('Redis ping failed');
    }
  } catch (error) {
    logger.error('❌ Upstash Redis connection failed:', error);
    throw error;
  }
}

// Cache service with proper Upstash Redis usage
export class CacheService {
  // Cache user profile
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
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get cached profile ${uid}:`, error);
      return null;
    }
  }

  // Cache user matches
  static async setUserMatches(uid: string, matches: any[], ttl: number = 3600): Promise<void> {
    try {
      await redis.set(`matches:${uid}`, JSON.stringify(matches), { ex: ttl });
      logger.info(`✅ Cached ${matches.length} matches for user: ${uid}`);
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
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return Array.isArray(parsed) ? parsed : null;
      }
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get cached matches ${uid}:`, error);
      return null;
    }
  }

  // Increment skill popularity using sorted sets (FIXED)
  static async incrementSkillPopularity(skill: string): Promise<void> {
    try {
      // Use zincrby which is properly supported in Upstash Redis
      await redis.zincrby('popular_skills', 1, skill.toLowerCase());
      logger.info(`📈 Incremented popularity for skill: ${skill}`);
    } catch (error) {
      logger.error(`❌ Failed to increment skill popularity ${skill}:`, error);
    }
  }

  // Get popular skills (FIXED - using proper Upstash Redis API)
  static async getPopularSkills(limit: number = 10): Promise<{ skill: string; score: number }[]> {
    try {
      // Use the correct Upstash Redis method for sorted sets
      const skills = await redis.zrange('popular_skills', 0, limit - 1, {
        rev: true,      // This makes it equivalent to zrevrange
        withScores: true
      });
      
      const result = [];
      
      // Process the returned array
      if (Array.isArray(skills)) {
        for (let i = 0; i < skills.length; i += 2) {
          result.push({
            skill: skills[i] as string,
            score: skills[i + 1] as number
          });
        }
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Failed to get popular skills:', error);
      // Fallback: try alternative method
      try {
        // Alternative using sendCommand (raw Redis command)
        const rawResult = await (redis as any).sendCommand([
          'ZREVRANGE', 
          'popular_skills', 
          '0', 
          (limit - 1).toString(), 
          'WITHSCORES'
        ]);
        
        const result = [];
        if (Array.isArray(rawResult)) {
          for (let i = 0; i < rawResult.length; i += 2) {
            result.push({
              skill: rawResult[i] as string,
              score: parseFloat(rawResult[i + 1] as string)
            });
          }
        }
        
        return result;
      } catch (fallbackError) {
        logger.error('❌ Fallback method also failed:', fallbackError);
        return [];
      }
    }
  }

  // Get top skills by count (alternative implementation)
  static async getTopSkills(limit: number = 10): Promise<{ skill: string; count: number }[]> {
    try {
      // Use zrange with rev option (Upstash Redis supports this)
      const skills = await redis.zrange('popular_skills', 0, limit - 1, {
        rev: true,
        withScores: true
      });
      
      const result = [];
      if (Array.isArray(skills)) {
        for (let i = 0; i < skills.length; i += 2) {
          result.push({
            skill: skills[i] as string,
            count: Math.round(skills[i + 1] as number)
          });
        }
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Failed to get top skills:', error);
      return [];
    }
  }

  // Rate limiting
  static async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      return current <= limit;
    } catch (error) {
      logger.error(`❌ Rate limit check failed for ${key}:`, error);
      return true; // Allow on error
    }
  }

  // Clear user cache
  static async clearUserCache(uid: string): Promise<void> {
    try {
      await redis.del(`user:${uid}`, `matches:${uid}`);
      logger.info(`🗑️ Cleared cache for user: ${uid}`);
    } catch (error) {
      logger.error(`❌ Failed to clear cache for ${uid}:`, error);
    }
  }

  // Generic cache methods
  static async setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
      logger.info(`✅ Cached data with key: ${key}`);
    } catch (error) {
      logger.error(`❌ Failed to cache data with key ${key}:`, error);
    }
  }

  static async getCache(key: string): Promise<any | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
      return null;
    } catch (error) {
      logger.error(`❌ Failed to get cache with key ${key}:`, error);
      return null;
    }
  }
}

export default redis;
