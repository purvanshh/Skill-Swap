import express from 'express';
import { MatchController } from '../controllers/matchController';
import { authenticateToken } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { matchRateLimit } from '../middleware/ratelimitter';

const router = express.Router();

/**
 * @route   GET /api/match
 * @desc    Get matched users for current user
 * @access  Private
 * @query   { limit?, offset? }
 */
router.get('/',
  authenticateToken,
  matchRateLimit,
  validatePagination,
  MatchController.getMatches
);

/**
 * @route   POST /api/match/refresh
 * @desc    Force refresh user matches (clears cache)
 * @access  Private
 */
router.post('/refresh',
  authenticateToken,
  matchRateLimit,
  MatchController.refreshMatches
);

/**
 * @route   GET /api/match/skills/popular
 * @desc    Get popular skills for suggestions
 * @access  Public
 * @query   { limit? }
 */
router.get('/skills/popular',
  MatchController.getPopularSkills
);

/**
 * @route   GET /api/match/stats
 * @desc    Get matching statistics for current user
 * @access  Private
 */
router.get('/stats',
  authenticateToken,
  MatchController.getMatchStats
);

export default router;