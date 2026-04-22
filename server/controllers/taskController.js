const Task = require('../models/Task');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Email credentials not set. Simulated email:', options.subject, 'to', options.to);
      return;
  }
  const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
  });
  await transporter.sendMail({
      from: `"Study Palace Hub HRMS" <${process.env.SMTP_USER}>`,
      ...options
  });
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin/HR/Manager/AGM)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;
    
    // Only management can create tasks
    if (!['Admin', 'HR', 'Manager', 'AGM'].includes(req.user.role)) {
       return res.status(403).json({ message: 'Only management roles can assign tasks' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      deadline
    });

    const assignee = await User.findById(assignedTo);
    if (assignee && assignee.email) {
      const emailText = `Hello ${assignee.name},\n\nA new task has been assigned to you by ${req.user.name}.\n\nTask Details:\nTitle: ${title}\nDescription: ${description || 'N/A'}\nPriority: ${priority}\nDeadline: ${deadline ? new Date(deadline).toLocaleString() : 'No Deadline'}\nAssigned Date: ${new Date().toLocaleString()}\n\nPlease log in to the HRMS portal to manage this task.`;
      
      await sendEmail({
        to: assignee.email,
        subject: `New Task Assigned: ${title}`,
        text: emailText
      }).catch(err => console.error('Failed to send task assignment email:', err));
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks (filtered by user or role)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let query = {};

    // Standard Visibility:
    // Employees: see only their assigned tasks
    // Managers/AGM: see tasks they assigned OR tasks assigned to them
    // Admin/HR: see everything
    
    if (req.user.role === 'Employee') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'Manager' || req.user.role === 'AGM') {
      query = { 
        $or: [
          { assignedBy: req.user._id }, 
          { assignedTo: req.user._id }
        ] 
      };
    } else if (req.user.role === 'HR' || req.user.role === 'Admin') {
       query = {};
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name role')
      .populate('history.updatedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Update task status/progress
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const task = await Task.findById(req.id || req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions: only assignee can update status, or assigner
    if (task.assignedTo.toString() !== req.user._id.toString() && 
        task.assignedBy.toString() !== req.user._id.toString() &&
        !['Admin', 'HR', 'AGM'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Enforce remarks for status change
    if (status && status !== task.status && !comment) {
       return res.status(400).json({ message: 'Remarks are required when changing task status' });
    }

    if (status) {
       task.status = status;
       if (status === 'Completed') {
          task.completedAt = new Date();
       }
    }
    
    task.history.push({
      status: status || task.status,
      comment: comment || 'No remarks provided',
      updatedBy: req.user._id
    });

    await task.save();

    const taskPopulated = await Task.findById(task._id).populate('assignedBy', 'name email').populate('assignedTo', 'name');
    if (taskPopulated && taskPopulated.assignedBy && taskPopulated.assignedBy.email) {
       const emailText = `Hello ${taskPopulated.assignedBy.name},\n\nThe status of the task "${taskPopulated.title}" (assigned to ${taskPopulated.assignedTo.name}) has been updated.\n\nNew Status: ${status || taskPopulated.status}\nRemark: ${comment || 'No remarks provided'}\nUpdated By: ${req.user.name}\n\nPlease log in to the HRMS portal to view more details.`;
       
       await sendEmail({
         to: taskPopulated.assignedBy.email,
         subject: `Task Status Updated: ${taskPopulated.title}`,
         text: emailText
       }).catch(err => console.error('Failed to send task update email:', err));
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/HR/Assigner)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.assignedBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };

