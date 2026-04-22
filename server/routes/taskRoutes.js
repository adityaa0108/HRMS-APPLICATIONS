const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('Admin', 'HR', 'Manager'), createTask);

router.route('/:id')
  .patch(protect, updateTask)
  .delete(protect, authorize('Admin', 'HR'), deleteTask);

module.exports = router;
