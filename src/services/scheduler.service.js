// src/services/scheduler.service.js
const Bull = require('bull');
const logger = require('../utils/logger');
const Task = require('../models/task.model');
const redisService = require('./redis.service');
const config = require('../config/config');
class SchedulerService {
  constructor() {
    this.taskQueue = new Bull('task-queue', {
      redis: {
        host: config.REDISCLOUD_HOST,  // Extracted from the URL
        port: config.REDISCLOUD_PORT,  // Port from the URL
        password: config.REDISCLOUD_PASSWORD,  // Extracted from the URL
    }
    });
    
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Set up Bull queue event listeners
      this.taskQueue.on('completed', async (job, result) => {
        logger.info(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
        await this.updateTaskStatus(job.data.taskId, 'completed', { result });
      });

      this.taskQueue.on('failed', async (job, error) => {
        logger.error(`Job ${job.id} failed with error: ${error.message}`);
        await this.updateTaskStatus(job.data.taskId, 'failed', { error: error.message });
        
        // Check if retries are needed
        const task = await Task.findById(job.data.taskId);
        if (task && task.retries < task.maxRetries) {
          await this.retryTask(task);
        }
      });

      this.taskQueue.on('active', async (job) => {
        logger.info(`Job ${job.id} has started processing`);
        await this.updateTaskStatus(job.data.taskId, 'running');
      });

      this.initialized = true;
      logger.info('Scheduler service initialized');
    } catch (error) {
      logger.error(`Scheduler initialization error: ${error.message}`);
      throw error;
    }
  }

  async scheduleTask(task,userid) {
    try {
      await this.initialize();
      
      // Calculate delay for the task
      let delay = 0;
      const scheduleTime = new Date(task.scheduleTime);
      if (task.scheduleType === 'delay') {
        // Delay is in milliseconds from now
        
        delay = task.payload.delayMs || 0;

      } else if (task.scheduleType === 'specific_time') {
        // Calculate milliseconds until the specific time
        const now = new Date();
        
        delay = scheduleTime.getTime() - now.getTime();
        
        // If time is in the past, execute immediately
        if (delay < 0) delay = 0;
      }
      
      // Add job to Bull queue
      const jobOptions = {
        delay,
        attempts: task.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: 5000 // Start with 5-second delay for retry
        },
        removeOnComplete: false,
        removeOnFail: false
      };
      
      // Add job to queue
      // await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay
      console.log("scheduleType","scheduleType1")
      const job = await this.taskQueue.add(
        { 
          taskId: task._id.toString(),
          user_id: task.userId,
          type: task.type,
          payload: task.payload
        }, 
        jobOptions
      );
      console.log("scheduleType","scheduleType2")
      // Update task with job ID and status
      task.jobId = job.id.toString();
      task.status = 'scheduled';
      await task.save();
      
      logger.info(`Task ${task._id} scheduled with job ID ${job.id}, delay: ${delay}ms`);
      const taskId=task._id.toString()
      // Also schedule in Redis for redundancy
      const some=await redisService.scheduleTask(taskId, task.scheduleTime);
      // // console.log(some)
      return task;
    } catch (error) {
      logger.error(`Error scheduling task: ${error.message}`);
      throw error;
    }
  }

  async cancelTask(taskId) {
    try {
      // Find the task
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Check if task can be canceled
      if (['completed', 'failed', 'canceled'].includes(task.status)) {
        throw new Error(`Task cannot be canceled in ${task.status} status`);
      }
      console.log("here")
      // Cancel the Bull job if we have a job ID
      if (task.jobId) {
        await this.taskQueue.removeJobs(task.jobId);
      }
      console.log("here2")
      // Also remove from Redis
      await redisService.cancelTask(task._id.toString());
      console.log("here3")
      // Update task status
      task.status = 'canceled';
      await task.save();
      
      logger.info(`Task ${taskId} has been canceled`);
      return task;
    } catch (error) {
      logger.error(`Error canceling task ${taskId}: ${error}`);
      throw error;
    }
  }

  async rescheduleTask(taskId, newScheduleTime) {
    try {
      // First cancel the existing task
      await this.cancelTask(taskId);
      
      // Get the task and update its schedule time
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      task.scheduleTime = new Date(newScheduleTime);
      task.status = 'created'; // Reset status
      await task.save();
      
      // Schedule again
      return await this.scheduleTask(task);
    } catch (error) {
      logger.error(`Error rescheduling task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async updateTaskStatus(taskId, status, data = {}) {
    try {
      const updateData = { status, ...data };
      
      if (status === 'running') {
        updateData.startedAt = new Date();
      } else if (['completed', 'failed'].includes(status)) {
        updateData.completedAt = new Date();
      }
      
      const task = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateData },
        { new: true }
      );
      
      return task;
    } catch (error) {
      logger.error(`Error updating task status: ${error.message}`);
      throw error;
    }
  }

  async retryTask(task) {
    try {
      // Increment retry count
      task.retries += 1;
      task.status = 'scheduled';
      await task.save();
      
      // Calculate exponential backoff
      const backoffDelay = Math.pow(2, task.retries) * 5000; // 5s, 10s, 20s, 40s, etc.
      
      // Schedule the task again with backoff
      const job = await this.taskQueue.add(
        { 
          taskId: task._id.toString(),
          type: task.type,
          payload: task.payload
        }, 
        { 
          delay: backoffDelay,
          attempts: 1,
          removeOnComplete: false,
          removeOnFail: false
        }
      );
      
      logger.info(`Retrying task ${task._id} (attempt ${task.retries}/${task.maxRetries}) with job ID ${job.id}, delay: ${backoffDelay}ms`);
      
      return task;
    } catch (error) {
      logger.error(`Error retrying task: ${error.message}`);
      throw error;
    }
  }

  async getQueueStatistics() {
    try {
      const [
        waiting,
        active,
        completed,
        failed,
        getCompleted,
        getwaiting,
        getactive,
        getfailed,
      ] = await Promise.all([
        this.taskQueue.getWaitingCount(),
        this.taskQueue.getActiveCount(),
        this.taskQueue.getCompletedCount(),
        this.taskQueue.getFailedCount(),
        this.taskQueue.getCompleted(),
        this.taskQueue.getWaiting(),
        this.taskQueue.getActive(),
        this.taskQueue.getFailed()
      ]);
      
      // console.log({
      //   waiting,
      //   active,
      //   completed,
      //   failed,
      //   total: waiting + active + completed + failed,
      //   getCompleted,
      //   getwaiting,
      //   getactive,
      //   getfailed,
      // })
      return {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
        getCompleted,
        getwaiting,
        getactive,
        getfailed,
      };
   
    } catch (error) {
      logger.error(`Error getting queue statistics: ${error.message}`);
      throw error;
    }
  }

  async shutdown() {
    if (this.taskQueue) {
      await this.taskQueue.close();
      logger.info('Task queue shut down');
    }
  }
}

// Export singleton instance
const schedulerService = new SchedulerService();
module.exports = schedulerService;