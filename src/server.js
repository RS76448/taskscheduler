// src/server.js
const app = require('./app');
const logger = require('./utils/logger');
const redisService = require('./services/redis.service');
const schedulerService = require('./services/scheduler.service');
const TaskWorker = require('./workers/task.worker');

// Set up uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
  logger.error(err.stack);
  // Give logger time to write
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Set port
const PORT = process.env.PORT || 3000;

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to Redis
    await redisService.connect();
    
    // Initialize scheduler
    await schedulerService.initialize();
    
    // Start task worker
    const worker = new TaskWorker();
    await worker.start();
    
    logger.info('All services initialized successfully');
    
    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      
      // Close services
      await worker.stop();
      await schedulerService.shutdown();
      await redisService.disconnect();
      
      logger.info('All services shut down successfully');
      process.exit(0);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error(`Service initialization error: ${error.message}`);
    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  await initializeServices();
});

// Set up unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.message}`);
  logger.error(err.stack);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;