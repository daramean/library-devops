// ═══════════════════════════════════════════
//  users.routes.js
//  User management endpoints
// ═══════════════════════════════════════════
const express = require('express');
const userRouter = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Get all users (admin only)
userRouter.get('/', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Users list fetched successfully',
    data: [
      { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { id: 2, name: 'Test User', email: 'user@example.com', role: 'user' },
    ],
  });
});

// Get user by ID
userRouter.get('/:id', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User fetched successfully',
    data: {
      id: req.params.id,
      name: 'Test User',
      email: 'user@example.com',
      role: 'user',
    },
  });
});

// Get current user profile
userRouter.get('/profile/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: {
      id: req.user.id,
      name: 'Current User',
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Update user profile
userRouter.put('/:id', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { id: req.params.id, ...req.body },
  });
});

// Delete user (admin only)
userRouter.delete('/:id', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: { id: req.params.id },
  });
});

module.exports = userRouter;
