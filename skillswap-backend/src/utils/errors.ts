import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

// 404 handler for unknown routes
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Global error handler
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Handle known operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }
  // Handle specific error types
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  else if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  }
  else if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference';
  }

  // Log error (don't log operational errors as errors, they're expected)
  if (!isOperational || statusCode >= 500) {
    logger.error(`${error.name}: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    logger.warn(`${error.name}: ${error.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    statusCode
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error.message;
  }

  // Add request ID if available (useful for tracking)
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to avoid try-catch in every async route handler
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') { // Unique violation
    return new ConflictError('Resource already exists');
  }
  if (error.code === '23503') { // Foreign key violation
    return new ValidationError('Invalid reference');
  }
  if (error.code === '23502') { // Not null violation
    return new ValidationError('Required field missing');
  }
  if (error.code === '22P02') { // Invalid input syntax
    return new ValidationError('Invalid input format');
  }
  
  // Default to internal server error for unknown database errors
  logger.error('Database error:', error);
  return new AppError('Database operation failed', 500, false);
};