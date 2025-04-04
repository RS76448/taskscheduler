// src/services/redis.service.js
const Redis = require('redis');
const { promisify } = require('util');
const logger = require('../utils/logger');
const config = require('../config/config');
class RedisService {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.connected = false;
    
    // Promisified methods will be initialized when client is connected
    this.getAsync = null;
    this.setAsync = null;
    this.delAsync = null;
    this.zaddAsync = null;
    this.zrangeAsync = null;
    this.zremAsync = null;
    this.publishAsync = null;
  }
  async createredisclient() {
    const client = Redis.createClient({
      url: config.REDISCLOUD_URL
    });
    
  console.log("client=====>",{ host:  'redis', 
    port:  6379})
  
  
    try {
      await client.connect(); // Ensure connection before returning
      // console.log("🔗 Connected to Redis!");
      return client;
    } catch (error) {
      console.error("❌ Redis Connection Failed:", error);
      throw error; // Throw error so caller knows connection failed
    }
  }
  
  async connect() {
    try {
      // console.log("Starting Redis connection..."); // Debug: start connection attempt
  
      // Create Redis client for general operations
      
      this.client = await this.createredisclient()
      // console.log("After calling Redis.createClient...");

      // Create separate connections for pub/sub
      this.subscriber = await this.createredisclient()
  
      this.publisher = await this.createredisclient()
      // console.log("this.client", this.client)
      this.getAsync = promisify(this.client.get).bind(this.client);
      this.setAsync = promisify(this.client.set).bind(this.client);
      this.delAsync = promisify(this.client.del).bind(this.client);
      this.zaddAsync = promisify(this.client.zAdd).bind(this.client);
      this.zrangeAsync = promisify(this.client.zRange).bind(this.client);
      this.zremAsync = promisify(this.client.zRem).bind(this.client);
      this.publishAsync = promisify(this.publisher.publish).bind(this.publisher);
      
      this.connected = true;
      logger.info('Redis client connected and methods promisified');
      // console.log("this.client", this.client)
      return this.client; // Return the client for further use
    } catch (error) {
      console.error(`Redis service initialization error: ${error}`); // Debug: Service error
      throw error;
    }
  }
  

  async disconnect() {
    if (this.client) {
      this.client.quit();
      this.subscriber.quit();
      this.publisher.quit();
      this.connected = false;
      logger.info('Redis disconnected');
    }
  }

  async subscribe(channel, callback) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }
      
      this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
      logger.info(`Subscribed to channel: ${channel}`);
    } catch (error) {
      logger.error(`Redis subscribe error: ${error.message}`);
      throw error;
    }
  }

  async publish(channel, message) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }
      
      const msgString = typeof message === 'string' ? message : JSON.stringify(message);
      await this.publishAsync(channel, msgString);
      logger.debug(`Published to channel ${channel}: ${msgString}`);
    } catch (error) {
      logger.error(`Redis publish error: ${error.message}`);
      throw error;
    }
  }

  async scheduleTask(taskId, executeAt) {
    // console.log("calling connecct")
    await this.connect()
    // console.log("connected")
    // console.log("calling scheduleTask")
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }
      
      // Add task to sorted set with score as timestamp
      const timestamp = new Date(executeAt).getTime();
      // console.log(`Scheduling task ${taskId} for ${executeAt} (${timestamp})`);
      console.log(taskId, executeAt, timestamp)
      const res = await this.client.zAdd('scheduled_tasks', [
        { score: timestamp, value: taskId }
      ]);
      // console.log(res)
      logger.info(`Task ${taskId} scheduled for ${executeAt} (${timestamp})`);
      return true;
    } catch (error) {
      logger.error(`Redis schedule task error: ${error.message}`);
      throw error;
    }
  }

  async cancelTask(taskId) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }
      
      const removed = await this.client.zRem('scheduled_tasks', taskId);
      logger.info(`Task ${taskId} cancellation result: ${removed > 0 ? 'canceled' : 'not found'}`);
      return removed > 0;
    } catch (error) {
      logger.error(`Redis cancel task error: ${error.message}`);
      throw error;
    }
  }

  async getScheduledTasks(startTime, endTime) {
    try {
      if (!this.connected) {
        throw new Error('Redis not connected');
      }
      
      return await this.zrangeAsync('scheduled_tasks', startTime, endTime);
    } catch (error) {
      logger.error(`Redis get scheduled tasks error: ${error.message}`);
      throw error;
    }
  }
}

// createredisclient()
// Export singleton instance
const redisService = new RedisService();
module.exports = redisService;