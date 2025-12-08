const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const { sendErrorResponse, handleMongoError } = require('../utils/errorHandler');
const jwt = require('jsonwebtoken');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
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

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      const userExists = await User.findOne({ email });

      if (userExists) {
        return sendErrorResponse(res, 400, 'User with this email already exists');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
      });

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);

      // Handle MongoDB duplicate key error
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return sendErrorResponse(res, 400, 'Validation error', messages);
      }

      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
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

    const { email, password } = req.body;

    try {
      // Check if user exists and get password
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return sendErrorResponse(res, 401, 'Invalid email or password');
      }

      // Check password
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return sendErrorResponse(res, 401, 'Invalid email or password');
      }

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendErrorResponse(res, 401, 'Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Find user and verify refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return sendErrorResponse(res, 401, 'Invalid or expired refresh token');
    }

    // Generate new access token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return sendErrorResponse(res, 401, 'Refresh token has expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return sendErrorResponse(res, 401, 'Invalid refresh token');
    }

    return sendErrorResponse(res, 401, 'Invalid or expired refresh token');
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

