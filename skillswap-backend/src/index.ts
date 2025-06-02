import { config } from 'dotenv';
config(); // Load environment variables first

import app from './app';
import { logger } from './utils/logger';
import { testFirestoreConnection } from './config/firebase';
import { connectRedis } from './config/redis';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test Firestore connection
    await testFirestoreConnection();
    logger.info('✅ Firestore connected successfully');

    // Test Redis connection (non-critical)
    try {
      await connectRedis();
      logger.info('✅ Redis connected successfully');
    } catch (redisError) {
      logger.warn('⚠️ Redis connection failed - continuing without cache:', redisError);
      logger.warn('📝 App will continue but performance may be impacted');
    }

    // Start the Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 SkillSwap Backend running on port ${PORT}`);
      logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔥 Using Firestore database`);
      logger.info(`📡 Server ready to accept connections`);
      logger.info(`🌍 Server URL: http://localhost:${PORT}`);
    });

    // Configure server timeouts
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`📴 ${signal} received, shutting down gracefully`);
  
  try {
    // Give ongoing requests time to finish
    logger.info('⏳ Waiting for ongoing requests to finish...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Note: Firebase Admin SDK connections are managed automatically
    // Redis connections (Upstash) are HTTP-based and don't need explicit closing
    
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at:', { promise, reason });
  logger.error('🚨 Full error details:', reason);
  
  // Give time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('🚨 Uncaught Exception:', error);
  
  // Give time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle warnings
process.on('warning', (warning) => {
  logger.warn('⚠️ Process Warning:', warning);
});

// Start the server
startServer().catch((error) => {
  logger.error('❌ Fatal error during server startup:', error);
  process.exit(1);
});

// Log successful startup
logger.info('🎯 SkillSwap Backend initialization started');
logger.info(`📦 Node.js version: ${process.version}`);
logger.info(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
