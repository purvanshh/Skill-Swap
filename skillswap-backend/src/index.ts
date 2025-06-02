import { config } from 'dotenv';
config(); // Load environment variables first

import app from './app';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 SkillSwap Backend running on port ${PORT}`);
      logger.info(`📖 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at unhandled promise', { promise, reason });
  process.exit(1);
});

startServer();