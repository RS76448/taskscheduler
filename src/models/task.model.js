// src/models/task.model.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'notification', 'log', 'http_request', 'custom']
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  scheduleType: {
    type: String,
    required: true,
    enum: ['delay', 'specific_time', 'recurring']
  },
  scheduleTime: {
    type: Date,
    required: true
  },
  cronExpression: {
    type: String,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'scheduled', 'pending', 'running', 'completed', 'failed', 'canceled'],
    default: 'created'
  },
  retries: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  jobId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add index for efficient queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ scheduleTime: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;