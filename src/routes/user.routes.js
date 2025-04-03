// src/routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile);

router.get('/registerview', userController.registerview);
router.get('/loginview', userController.loginview);

// Protected routes
router.get('/profileview', userController.getProfileview);

module.exports = router;