// src/controllers/user.controller.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    logger.info(`New user registered: ${email}`);
    
    // Return user data and token
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not register user',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    logger.info(`User logged in: ${email}`);
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    // Return token and user data
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not fetch user profile',
      error: error.message
    })
}
}


exports.registerview = async (req, res) => {
  return  res.render("user/register");
};

// Login user
exports.loginview = async (req, res) => {
  return  res.render("user/login");
};

// Get current user profile
exports.getProfileview = async (req, res) => {
  return  res.render("user/profile", { user: req.user });
}