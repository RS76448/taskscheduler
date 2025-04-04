// src/workers/task.worker.js
const Bull = require('bull');
const logger = require('../utils/logger');
const redisService = require('../services/redis.service');
const taskModel = require('../models/task.model');
const { default: mongoose } = require('mongoose');
const config = require('../config/config');
class TaskWorker {
  constructor() {
    this.taskQueue = new Bull('task-queue', {
      redis: {
        host: config.REDISCLOUD_HOST,  // Extracted from the URL
        port: config.REDISCLOUD_PORT,  // Port from the URL
        password: config.REDISCLOUD_PASSWORD,  // Extracted from the URL// Extracted from the URL
    }
    });
  }
  async marktaskascompleted(id,taskId, result) {
    try {
      const job = await this.taskQueue.getJob(id);
      if (job) {
        await job.update({ result, status: 'completed' });
        await taskModel.updateOne({ _id:new mongoose.Types.ObjectId(taskId) }, { status: 'completed', result });
        logger.info(`Task ${taskId} marked as completed`);
      } else {
        logger.warn(`Task ${taskId} not found`);
      }
    } catch (error) {
      logger.error(`Error marking task ${taskId} as completed: ${error.message}`);
    }
  }
  async start() {
    try {
      // Connect to Redis

      // await this.sendEmail()
      await redisService.connect();
      console.log('Connected to Redis');
      // const active=await this.taskQueue.getJob("67ed5fdc2e03e3ee698645d9")
      // console.log(active);
      // Process tasks from the queue
      this.taskQueue.process(async (job) => {
        //just added this to show active tasks in taskstats
        // await new Promise(resolve => setTimeout(resolve, 10000)); // 10-second delay
        const { taskId, type, payload } = job.data;
        console.log('job data', job);
        const {id}=job
        logger.info(`Processing task ${taskId} of type ${type}`);
        await this.marktaskascompleted(id,taskId, { status: 'completed' });
        try {
          // Execute the task based on its type
          switch (type) {
            case 'email':
              return await this.sendEmail(taskId,payload);
            case 'notification':
              return await this.sendNotification(payload);
            case 'log':
              return await this.logMessage(payload);
            case 'http_request':
              return await this.makeHttpRequest(payload);
            case 'custom':
              return await this.executeCustomTask(payload);
            default:
              throw new Error(`Unsupported task type: ${type}`);
          }
        } catch (error) {
          logger.error(`Task ${taskId} execution failed: ${error.message}`);
          throw error; // Re-throw to let Bull handle the failure
        }
      });
      
      logger.info('Task worker started and processing jobs');
    } catch (error) {
      logger.error(`Error starting task worker: ${error.message}`);
      throw error;
    }
  }

  async stop() {
    try {
      await this.taskQueue.close();
      await redisService.disconnect();
      logger.info('Task worker stopped');
    } catch (error) {
      logger.error(`Error stopping task worker: ${error.message}`);
      throw error;
    }
  }

  // Implementation of different task types
  async sendEmail(taskId,payload) {
    const { to, subject, body } = payload;
    
    logger.info(`Sending email to ${to} with subject: ${subject}`);
    
    // In a real application, you would use a library like nodemailer here
    // This is a mock implementation

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate email sending
    
    return {
      success: true,
      message: `Email sent to ${to}`,
      timestamp: new Date()
    };
  }
  
  async sendNotification(payload) {
    const { userId, message } = payload;
    logger.info(`Sending notification to user ${userId}: ${message}`);
    
    // In a real application, you would use a service like Firebase Cloud Messaging
    // This is a mock implementation
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate notification sending
    
    return {
      success: true,
      message: `Notification sent to user ${userId}`,
      timestamp: new Date()
    };
  }

  async logMessage(payload) {
    const { level, message } = payload;
    logger[level || 'info'](message);
    
    return {
      success: true,
      message: 'Message logged successfully',
      timestamp: new Date()
    };
  }

  async makeHttpRequest(payload) {
    const { url, method, headers, body } = payload;
    logger.info(`Making ${method} request to ${url}`);
    
    // In a real application, you would use a library like axios or node-fetch
    // This is a mock implementation
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate HTTP request
    
    return {
      success: true,
      message: `HTTP ${method} request sent to ${url}`,
      timestamp: new Date()
    };
  }

  async executeCustomTask(payload) {
    const { functionName, args } = payload;
    logger.info(`Executing custom task: ${functionName}`);
    
    // This is a simple example - in a real app, you might have a more sophisticated
    // way to safely execute custom code
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate task execution
    
    return {
      success: true,
      message: `Custom task ${functionName} executed`,
      args,
      timestamp: new Date()
    };
  }
}

module.exports = TaskWorker;