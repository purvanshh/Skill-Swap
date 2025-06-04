import { Request, Response, NextFunction } from 'express';
import { firestore } from '../config/firebase';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { FieldValue } from 'firebase-admin/firestore';

export class MatchController {
  // Get matched users for current user
  static async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get user's data first
      const userDoc = await firestore.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data()!;
      const userSkillsWanted = userData.skills_wanted || [];
      const userSkillsOffered = userData.skills_offered || [];

      // Check if we have cached matches (stored in user's matches subcollection)
      const cachedMatchesQuery = await firestore
        .collection('users')
        .doc(uid)
        .collection('cached_matches')
        .orderBy('score', 'desc')
        .get();

      let matches: any[] = [];

      if (!cachedMatchesQuery.empty && cachedMatchesQuery.docs.length > 0) {
        // Use cached matches if available and not expired (1 hour)
        const firstMatch = cachedMatchesQuery.docs[0].data();
        const cacheAge = Date.now() - firstMatch.cached_at?.toMillis();
        
        if (cacheAge < 3600000) { // 1 hour in milliseconds
          matches = cachedMatchesQuery.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id
          }));
          
          logger.info(`✅ Using cached matches for user: ${uid}`);
        }
      }

      // If no valid cached matches, compute new ones
      if (matches.length === 0) {
        logger.info(`🔍 Computing matches for user: ${uid}`);
        
        // Find users with matching skills
        const potentialMatches = await firestore
          .collection('users')
          .where('uid', '!=', uid)
          .get();

        const computedMatches: any[] = [];

        potentialMatches.forEach(doc => {
          const otherUser = doc.data();
          const otherSkillsOffered = otherUser.skills_offered || [];
          const otherSkillsWanted = otherUser.skills_wanted || [];

          // Calculate match score based on skill overlap
          let score = 0;
          
          // Skills the current user wants that the other user offers
          const skillsTheyCanTeach = userSkillsWanted.filter((skill: string) => 
            otherSkillsOffered.some((offered: string) => 
              offered.toLowerCase() === skill.toLowerCase()
            )
          );
          
          // Skills the other user wants that the current user offers
          const skillsICanTeach = otherSkillsWanted.filter((skill: string) => 
            userSkillsOffered.some((offered: string) => 
              offered.toLowerCase() === skill.toLowerCase()
            )
          );

          // Calculate score (mutual benefit gets higher score)
          score += skillsTheyCanTeach.length * 10;
          score += skillsICanTeach.length * 10;
          
          // Bonus for mutual teaching opportunity
          if (skillsTheyCanTeach.length > 0 && skillsICanTeach.length > 0) {
            score += 20;
          }

          if (score > 0) {
            computedMatches.push({
              uid: otherUser.uid,
              name: otherUser.name,
              avatar_url: otherUser.avatar_url,
              role: otherUser.role,
              skills_offered: otherUser.skills_offered,
              skills_wanted: otherUser.skills_wanted,
              availability: otherUser.availability,
              badge_count: otherUser.badge_count,
              score,
              skills_they_can_teach: skillsTheyCanTeach,
              skills_i_can_teach: skillsICanTeach
            });
          }
        });

        // Sort by score
        matches = computedMatches.sort((a, b) => b.score - a.score);

        // Cache the results
        if (matches.length > 0) {
          const batch = firestore.batch();
          
          // Clear existing cached matches
          const existingMatches = await firestore
            .collection('users')
            .doc(uid)
            .collection('cached_matches')
            .get();
          
          existingMatches.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Add new cached matches
          matches.forEach(match => {
            const matchRef = firestore
              .collection('users')
              .doc(uid)
              .collection('cached_matches')
              .doc(match.uid);
            
            batch.set(matchRef, {
              ...match,
              cached_at: FieldValue.serverTimestamp()
            });
          });

          await batch.commit();
        }
      }

      // Apply pagination
      const paginatedMatches = matches.slice(offset, offset + limit);

      logger.info(`✅ Retrieved ${paginatedMatches.length} matches for user: ${uid}`);

      res.status(200).json({
        success: true,
        data: {
          matches: paginatedMatches,
          pagination: {
            limit,
            offset,
            total: matches.length,
            hasMore: offset + limit < matches.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Force recompute matches (clears cache)
  static async refreshMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;

      // Clear cached matches
      const cachedMatches = await firestore
        .collection('users')
        .doc(uid)
        .collection('cached_matches')
        .get();

      const batch = firestore.batch();
      cachedMatches.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      logger.info(`🔄 Cleared cached matches for user: ${uid}`);

      res.status(200).json({
        success: true,
        message: 'Matches refreshed successfully. New matches will be computed on next request.'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get popular skills (for skill suggestions)
  static async getPopularSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get popular skills from Firestore
      const popularSkillsQuery = await firestore
        .collection('skill_popularity')
        .orderBy('count', 'desc')
        .limit(limit)
        .get();

      const skills = popularSkillsQuery.docs.map(doc => ({
        name: doc.data().name,
        popularity: doc.data().count
      }));

      res.status(200).json({
        success: true,
        data: {
          skills
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get match statistics for analytics
  static async getMatchStats(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user!.uid;

      // Get user's cached matches for stats
      const matchesQuery = await firestore
        .collection('users')
        .doc(uid)
        .collection('cached_matches')
        .get();

      const totalMatches = matchesQuery.size;
      let averageScore = 0;
      let highestScore = 0;

      if (totalMatches > 0) {
        let totalScore = 0;
        matchesQuery.forEach(doc => {
          const score = doc.data().score || 0;
          totalScore += score;
          if (score > highestScore) {
            highestScore = score;
          }
        });
        averageScore = Math.round(totalScore / totalMatches);
      }

      // Get user's skills for additional stats
      const userDoc = await firestore.collection('users').doc(uid).get();
      const userData = userDoc.data()!;

      const stats = {
        total_matches: totalMatches,
        average_match_score: averageScore,
        highest_match_score: highestScore,
        skills_offered_count: (userData.skills_offered || []).length,
        skills_wanted_count: (userData.skills_wanted || []).length
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
}