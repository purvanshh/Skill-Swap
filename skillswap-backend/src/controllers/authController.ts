// controllers/authController.ts - UPDATED TO WORK WITH MIDDLEWARE
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UserService } from '../services/userService';
import { CreateUserRequest } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

export class AuthController {
  // Register new user with Firebase
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // User info already extracted and verified by authenticateToken middleware
      const { uid, email } = req.user!;
      
      const { 
        name, 
        role = 'student', 
        avatar_url, 
        skills_offered = [], 
        skills_wanted = [], 
        availability = { days: [], times: [] } 
      } = req.body;

      if (!name) {
        throw new AppError('Name is required', 400);
      }

      // Use service layer for user creation
      const user = await UserService.createUser({
        uid,
        name: name.trim(),
        email,
        avatar_url: avatar_url || null,
        role,
        skills_offered,
        skills_wanted,
        availability
      });

      logger.info(`✅ User registered successfully: ${uid}`);

      // Return user data (excluding sensitive info)
      const responseData = {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        skills_offered: user.skills_offered,
        skills_wanted: user.skills_wanted,
        availability: user.availability,
        badge_count: user.badge_count
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: responseData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user (verify token and return user info)
static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // User info already extracted and verified by authenticateToken middleware
    const { uid, email } = req.user!;

    // Get user from service layer
    const user = await UserService.getUser(uid);

    if (!user) {
      // For OAuth users who haven't completed registration
      res.status(200).json({
        success: true,
        message: 'User needs to complete registration',
        data: {
          needsRegistration: true,
          email,
          uid
        }
      });
      return; // exit early
    }

    logger.info(`✅ User logged in successfully: ${uid}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          badge_count: user.badge_count
        }
      }
    });
  } catch (error) {
    next(error);
  }
}


  // Verify token endpoint (for frontend auth checks)
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      // User info already extracted and verified by authenticateToken middleware
      const { uid } = req.user!;
      
      const user = await UserService.getUser(uid);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            uid: user.uid,
            name: user.name,
            email: user.email,
            role: user.role,
            badge_count: user.badge_count
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout (mainly for logging purposes)
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = req.user?.uid;

      if (uid) {
        logger.info(`✅ User logged out: ${uid}`);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}