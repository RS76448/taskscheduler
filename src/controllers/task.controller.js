// src/controllers/task.controller.js
const Task = require('../models/task.model');
const schedulerService = require('../services/scheduler.service');
const logger = require('../utils/logger');

// Create a new task
exports.createTask = async (req, res) => {
 console.log("createTask",req.body)
  try {
    const { 
      name, 
      description, 
      type, 
      payload, 
      scheduleType, 
      scheduleTime, 
      cronExpression,
      maxRetries,
      delayMs
    } = req.body;
    // console.log("createTask",req)
    // Validate required fields
    let newpayload = payload;
    if(newpayload && typeof newpayload == 'object') {
      newpayload =JSON.parse(JSON.stringify(newpayload))
      newpayload.delayMs = delayMs || 0;
    }else{
      newpayload = {}
      newpayload.delayMs = delayMs || 0;
    }
    console.log("newpayload",newpayload)
    if (!name || !type || !scheduleType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, or scheduleType'
      });
    }
    
    // Validate schedule time based on schedule type
    if (scheduleType === 'specific_time' && !scheduleTime) {
      return res.status(400).json({
        success: false,
        message: 'scheduleTime is required for specific_time scheduling'
      });
    }
    
    if (scheduleType === 'recurring' && !cronExpression) {
      return res.status(400).json({
        success: false,
        message: 'cronExpression is required for recurring scheduling'
      });
    }
    
    // Calculate schedule time for delay type
    let finalScheduleTime = new Date(scheduleTime);
    if (scheduleType === 'delay') {
      const delayMsIN = delayMs || 0;
      finalScheduleTime = new Date(finalScheduleTime.getTime() + delayMsIN);
    }
    console.log("finalScheduleTime",finalScheduleTime)
    // Create task
    let task = new Task({
      name,
      description,
      type,
      
      payload: newpayload || {},
      scheduleType,
      scheduleTime: finalScheduleTime,
      cronExpression,
      maxRetries: maxRetries || 3,
      user: req.user._id,
      status: 'created'
    });
   
    
    // Save task to database
    task = await task.save();
    
    // Schedule the task
    task = await schedulerService.scheduleTask(task,req.user._id);
    console.log("scheduleType",scheduleType)
    logger.info(`Task ${task._id} created and scheduled by user ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    logger.error(`Error creating task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not create task',
      error: error.message
    });
  }
};

// Get all tasks for current user
exports.getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    // Build filter
    const filter = { user: req.user._id };
    
    // filter.status = {$ne:"canceled"};
    
    // console.log("filter",filter)
    console.log("page",page)
    console.log("limit",limit)
    console.log("skip",skip)
   
    
    // Get tasks
    const tasks = await Task.find(filter)
      .sort({ scheduleTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Task.countDocuments(filter);
    // console.log(tasks)
    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tasks
    });
  } catch (error) {
    logger.error(`Error getting tasks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve tasks',
      error: error.message
    });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    logger.error(`Error getting task ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve task',
      error: error.message
    });
  }
};

// Cancel task
exports.cancelTask = async (req, res) => {
  try {
    // Find task first to verify ownership
    const task = await Task.findOne({
      _id: req.params.id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if task can be canceled
    if (['completed', 'failed', 'canceled'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel task in ${task.status} state`
      });
    }
    
    // Cancel the task
    const canceledTask = await schedulerService.cancelTask(task._id);
    
    // logger.info(`Task ${task._id} canceled by user ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Task canceled successfully',
      task: canceledTask
    });
  } catch (error) {
    logger.error(`Error canceling task ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not cancel task',
      error: error.message
    });
  }
};

// Reschedule task
exports.rescheduleTask = async (req, res) => {
  try {
    const { scheduleTime } = req.body;
    
    if (!scheduleTime) {
      return res.status(400).json({
        success: false,
        message: 'New schedule time is required'
      });
    }
    
    // Find task first to verify ownership
    const task = await Task.findOne({
      _id: req.params.id,
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if task can be rescheduled
    if (['completed', 'failed', 'running'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule task in ${task.status} state`
      });
    }
    
    // Reschedule the task
    const rescheduledTask = await schedulerService.rescheduleTask(task._id, scheduleTime);
    
    // logger.info(`Task ${task._id} rescheduled by user ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Task rescheduled successfully',
      task: rescheduledTask
    });
  } catch (error) {
    logger.error(`Error rescheduling task ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not reschedule task',
      error: error.message
    });
  }
};

// Get stats for current user's tasks
exports.getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Convert to a more usable format
    const statsObj = {};
    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });
    
    // Add queue stats
    const queueStats = await schedulerService.getQueueStatistics();
    // console.log("queueStats",queueStats)
    // console.log("statsObj",statsObj)
    res.status(200).json({
      success: true,
      taskStats: statsObj,
      queueStats
    });
  } catch (error) {
    logger.error(`Error getting task stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve task statistics',
      error: error.message
    });
  }
};




exports.createTaskview = async (req, res) => {
 return res.render('tasks/createtasks');
};

// Get all tasks for current user
exports.getTasksview = async (req, res) => {
  return res.render('tasks/gettasks');
};

// Get task by ID
exports.getTaskByIdview = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.render('tasks/gettasksbyid', { task });
  } catch (error) {
    logger.error(`Error getting task ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve task',
      error: error.message
    });
  }
};



// Reschedule task
exports.rescheduleTaskview = async (req, res) => {
  const {id} = req.params;
  const task= await Task.findOne({
    _id: id
  });
 return res.render('tasks/rescheduletasks', { task });
};

// Get stats for current user's tasks
exports.getTaskStatsview = async (req, res) => {
  return res.render('tasks/getTaskStats');
  }

