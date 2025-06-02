import express from 'express';
import { AuthController } from '../controllers/authController';
import { validateRegistration } from '../middleware/validation';
import { authRateLimit } from '../middleware/ratelimitter';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with Firebase
 * @access  Public
 * @body    { idToken, name, role?, avatar_url?, skills_offered?, skills_wanted?, availability? }
 */
router.post('/register', 
  authRateLimit,
  validateRegistration,
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with Firebase ID token
 * @access  Public
 * @body    { idToken }
 */
router.post('/login',
  authRateLimit,
  (req, res, next) => {
    AuthController.login(req, res, next).catch(next);
  }
);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify Firebase ID token
 * @access  Public
 * @body    { idToken }
 */
router.post('/verify',
  AuthController.verifyToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (optional endpoint)
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  AuthController.logout
);

export default router;