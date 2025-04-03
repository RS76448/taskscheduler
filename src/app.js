// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const logger = require('./utils/logger');
const path = require("path");
// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();

app.use(session({
  secret: 'your_secret_key', // Secret key to encrypt session ID
  resave: false,  // Don't save session if it's not modified
  saveUninitialized: true,  // Store a session even if it's not modified
  cookie: { 
    httpOnly: true,  // Ensures the cookie is not accessible via JavaScript
    secure: false,  // Set to true if using HTTPS
    maxAge: 60000 * 60 * 24 // Cookie expires after 1 day
  }
}));
// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory (default is "views" in the root)
app.set("views", path.join(__dirname, "views"));

// Serve static files (like CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));
// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.http(message.trim()) } }));

// Connect to MongoDB
mongoose.connect("mongodb+srv://amrohitk70:17299271@cluster0.0v55eii.mongodb.net/task-scheduler?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.get('/', (req, res) => {
  res.redirect('/api/users/loginview'); // Redirect to login page
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports = app;