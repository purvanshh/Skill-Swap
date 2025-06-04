import { UserService } from './userService';
import { logger } from '../utils/logger';
import { User, UserMatch, MatchExplanation, MatchStats } from '../types';

export class MatchingService {
  // Main matching algorithm
  static async findMatches(uid: string, limit: number = 20): Promise<UserMatch[]> {
    try {
      // Get current user
      const currentUser = await UserService.getUser(uid);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Get all other users for matching
      const allUsers = await UserService.getUsersForMatching(uid, 200);

      // Calculate match scores
      const matchesWithScores = allUsers.map(user => ({
        ...user,
        match_score: this.calculateMatchScore(currentUser, user)
      })).filter(match => match.match_score > 0); // Only return users with some match

      // Sort by match score (highest first)
      matchesWithScores.sort((a, b) => b.match_score - a.match_score);

      // Take top matches and format response
      const topMatches = matchesWithScores.slice(0, limit).map(user => ({
        uid: user.uid,
        name: user.name,
        skills_offered: user.skills_offered,
        skills_wanted: user.skills_wanted,
        badge_count: user.badge_count,
        availability: user.availability,
        match_score: user.match_score
      })) as UserMatch[];

      logger.info(`🎯 Computed ${topMatches.length} matches for user ${uid}`);
      return topMatches;
    } catch (error) {
      logger.error(`❌ Matching service: Failed to find matches for ${uid}:`, error);
      throw error;
    }
  }

  // Calculate match score between two users
  private static calculateMatchScore(userA: User, userB: User): number {
    let score = 0;

    // Skill matching: userA wants what userB offers
    const skillsAWantsFromB = this.getSkillIntersection(userA.skills_wanted, userB.skills_offered);
    const skillsBWantsFromA = this.getSkillIntersection(userB.skills_wanted, userA.skills_offered);

    // Mutual skill match (both users can teach each other something)
    if (skillsAWantsFromB.length > 0 && skillsBWantsFromA.length > 0) {
      score += 50; // High score for mutual benefit
      score += skillsAWantsFromB.length * 10; // Additional points per matching skill
      score += skillsBWantsFromA.length * 10;
    }
    // One-way skill match
    else if (skillsAWantsFromB.length > 0 || skillsBWantsFromA.length > 0) {
      score += 25; // Lower score for one-way benefit
      score += Math.max(skillsAWantsFromB.length, skillsBWantsFromA.length) * 5;
    }

    // Availability overlap
    const availabilityOverlap = this.calculateAvailabilityOverlap(userA.availability, userB.availability);
    if (availabilityOverlap > 0) {
      score += 20 + (availabilityOverlap * 5); // Bonus for time compatibility
    }

    // Role compatibility bonus
    if (this.areRolesCompatible(userA.role, userB.role)) {
      score += 10;
    }

    // Badge count influence (experienced users get slight preference)
    const avgBadges = (userA.badge_count + userB.badge_count) / 2;
    score += Math.min(avgBadges * 2, 10); // Cap at 10 points

    // Normalize score to 0-100 range
    return Math.min(Math.round(score), 100);
  }

  // Find intersection of two skill arrays
  private static getSkillIntersection(skillsA: string[], skillsB: string[]): string[] {
    return skillsA.filter(skill =>
      skillsB.some(otherSkill =>
        skill.toLowerCase() === otherSkill.toLowerCase()
      )
    );
  }

  // Calculate availability overlap between two users
  private static calculateAvailabilityOverlap(availabilityA: any, availabilityB: any): number {
    if (!availabilityA || !availabilityB) return 0;

    const daysA = availabilityA.days || [];
    const daysB = availabilityB.days || [];
    const timesA = availabilityA.times || [];
    const timesB = availabilityB.times || [];

    // Find overlapping days
    const commonDays = daysA.filter((day: string) => daysB.includes(day));
    
    // Find overlapping times
    const commonTimes = timesA.filter((time: string) => timesB.includes(time));

    // Return combined overlap score
    return commonDays.length + commonTimes.length;
  }

  // Check if user roles are compatible for learning
  private static areRolesCompatible(roleA: string, roleB: string): boolean {
    // Students learning from mentors get bonus
    if ((roleA === 'student' && roleB === 'mentor') ||
        (roleA === 'mentor' && roleB === 'student')) {
      return true;
    }

    // Peer-to-peer learning also compatible
    return roleA === roleB;
  }

  // Get detailed match explanation
  static async getMatchExplanation(userAUid: string, userBUid: string): Promise<MatchExplanation> {
    try {
      const userA = await UserService.getUser(userAUid);
      const userB = await UserService.getUser(userBUid);

      if (!userA || !userB) {
        throw new Error('One or both users not found');
      }

      const skillsAWantsFromB = this.getSkillIntersection(userA.skills_wanted, userB.skills_offered);
      const skillsBWantsFromA = this.getSkillIntersection(userB.skills_wanted, userA.skills_offered);
      const availabilityOverlap = this.calculateAvailabilityOverlap(userA.availability, userB.availability);
      const matchScore = this.calculateMatchScore(userA, userB);

      return {
        match_score: matchScore,
        mutual_skills: skillsAWantsFromB.length > 0 && skillsBWantsFromA.length > 0,
        skills_a_wants_from_b: skillsAWantsFromB,
        skills_b_wants_from_a: skillsBWantsFromA,
        availability_overlap: availabilityOverlap,
        role_compatibility: this.areRolesCompatible(userA.role, userB.role)
      };
    } catch (error) {
      logger.error(`❌ Failed to get match explanation:`, error);
      throw error;
    }
  }

  // Get match statistics for a user
  static async getMatchStats(uid: string): Promise<MatchStats> {
    try {
      const matches = await this.findMatches(uid, 100);

      const stats = {
        total_matches: matches.length,
        high_score_matches: matches.filter(m => m.match_score >= 70).length,
        medium_score_matches: matches.filter(m => m.match_score >= 40 && m.match_score < 70).length,
        low_score_matches: matches.filter(m => m.match_score < 40).length,
        average_match_score: matches.length > 0
          ? matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length
          : 0,
        top_skills_in_demand: this.getTopSkillsFromMatches(matches, 'skills_wanted'),
        top_skills_offered: this.getTopSkillsFromMatches(matches, 'skills_offered')
      };

      return stats;
    } catch (error) {
      logger.error(`❌ Failed to get match stats for ${uid}:`, error);
      throw error;
    }
  }

  // Helper to get top skills from matches
  private static getTopSkillsFromMatches(matches: UserMatch[], field: 'skills_wanted' | 'skills_offered'): any[] {
    const skillCounts: { [key: string]: number } = {};

    matches.forEach(match => {
      match[field].forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));
  }
}
