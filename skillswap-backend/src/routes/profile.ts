import express from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateProfileUpdate, validateUidParam, validatePagination } from '../middleware/validation';
import { profileRateLimit } from '../middleware/ratelimitter';

const router = express.Router();

/**
 * @route   GET /api/profile/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  ProfileController.getMyProfile
);

/**
 * @route   GET /api/profile/:uid
 * @desc    Get public profile of another user
 * @access  Public
 */
router.get('/:uid',
  validateUidParam,
  ProfileController.getUserProfile
);

/**
 * @route   POST /api/profile/update
 * @desc    Update current user's profile
 * @access  Private
 * @body    { name?, avatar_url?, skills_offered?, skills_wanted?, availability? }
 */
router.post('/update',
  authenticateToken,
  profileRateLimit,
  validateProfileUpdate,
  ProfileController.updateProfile
);

/**
 * @route   POST /api/profile/badges
 * @desc    Update user's badge count (for achievements)
 * @access  Private
 * @body    { increment }
 */
router.post('/badges',
  authenticateToken,
  ProfileController.updateBadges
);

/**
 * @route   DELETE /api/profile/:uid?
 * @desc    Delete user profile (own profile or admin)
 * @access  Private
 */
router.delete('/:uid?',
  authenticateToken,
  ProfileController.deleteProfile
);

/**
 * @route   GET /api/profile/admin/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/stats',
  authenticateToken,
  requireRole(['admin']),
  ProfileController.getStats
);

export default router;