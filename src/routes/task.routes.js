// src/routes/task.routes.js
const express = require('express');
const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// All task routes are protected
// router.use(authMiddleware);
router.get('/createtaskview', taskController.createTaskview);
router.get('/gettaskview', taskController.getTasksview);
router.get('/taskstatsview', taskController.getTaskStatsview);
router.get('/view/:id', taskController.getTaskByIdview);

router.get('/:id/rescheduleview', taskController.rescheduleTaskview);
// Task routes
router.post('/', authMiddleware,taskController.createTask);
router.get('/', authMiddleware,taskController.getTasks);
router.get('/stats',authMiddleware, taskController.getTaskStats);
router.get('/:id',authMiddleware, taskController.getTaskById);
router.get('/:id/cancel', taskController.cancelTask);
router.post('/:id/reschedule', taskController.rescheduleTask);




module.exports = router;