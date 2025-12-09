const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { sendErrorResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   GET /api/protected/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to protected route',
    data: {
      user: req.user,
      message: 'This is a protected route',
    },
  });
});

// @route   PATCH /api/protected/user/currency
// @desc    Update user currency preference
// @access  Private
router.patch(
  '/user/currency',
  [
    body('currency')
      .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'])
      .withMessage('Invalid currency'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(
        res,
        400,
        'Validation error',
        errors.array().map((err) => ({ field: err.param, message: err.msg }))
      );
    }

    try {
      const user = await User.findById(req.user._id);
      user.currency = req.body.currency;
      await user.save();

      res.json({
        success: true,
        message: 'Currency preference updated successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            currency: user.currency,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Update currency error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   PATCH /api/protected/user/profile
// @desc    Update user profile (name, email)
// @access  Private
router.patch(
  '/user/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please include a valid email'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(
        res,
        400,
        'Validation error',
        errors.array().map((err) => ({ field: err.param, message: err.msg }))
      );
    }

    try {
      const user = await User.findById(req.user._id);
      
      if (req.body.name) {
        user.name = req.body.name;
      }
      
      if (req.body.email) {
        // Check if email is already taken by another user
        const emailExists = await User.findOne({ 
          email: req.body.email,
          _id: { $ne: user._id }
        });
        
        if (emailExists) {
          return sendErrorResponse(res, 400, 'Email is already taken');
        }
        
        user.email = req.body.email;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            currency: user.currency,
          },
        },
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   PATCH /api/protected/user/password
// @desc    Change user password
// @access  Private
router.patch(
  '/user/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(
        res,
        400,
        'Validation error',
        errors.array().map((err) => ({ field: err.param, message: err.msg }))
      );
    }

    try {
      const user = await User.findById(req.user._id).select('+password');
      
      // Verify current password
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return sendErrorResponse(res, 401, 'Current password is incorrect');
      }

      // Update password
      user.password = req.body.newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

module.exports = router;

