import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase';
import { UserModel } from '../models/user';
import { CacheService } from '../config/redis';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

// Middleware to authenticate Firebase JWT tokens
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('Authorization header is required', 401);
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw new AppError('Token is required', 401);
    }

    // Verify Firebase ID token
    const decodedToken = await verifyFirebaseToken(token);
    
    // Get user from cache first, then database
    let user = await CacheService.getUserProfile(decodedToken.uid);
    
    if (!user) {
      user = await UserModel.findByUid(decodedToken.uid);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Cache user profile for future requests
      await CacheService.setUserProfile(decodedToken.uid, user);
    }

    // Attach user to request object
    req.user = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name
    };

    logger.info(`🔐 User authenticated: ${user.uid}`);
    next();
  } catch (error) {
    logger.error('❌ Authentication failed:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
    return;
  }
};

// Middleware to check user role
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Optional authentication middleware (for public endpoints that benefit from user context)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decodedToken = await verifyFirebaseToken(token);
        const user = await UserModel.findByUid(decodedToken.uid);
        
        if (user) {
          req.user = {
            uid: user.uid,
            email: user.email,
            role: user.role,
            name: user.name
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    next();
  }
};