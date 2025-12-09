const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const { protect } = require('../middleware/auth');
const { sendErrorResponse, handleMongoError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('targetAmount').isFloat({ min: 0, max: 999999999 }).withMessage('Target amount must be between 0 and 999,999,999'),
    body('currentAmount').optional().isFloat({ min: 0, max: 999999999 }).withMessage('Current amount must be between 0 and 999,999,999'),
    body('targetDate').isISO8601().withMessage('Target date must be a valid ISO date'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
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
      const goal = await Goal.create({
        ...req.body,
        createdBy: req.user._id,
      });

      // Check completion status
      goal.checkCompletion();
      await goal.save();

      const populatedGoal = await Goal.findById(goal._id)
        .populate('createdBy', 'name email')
        .select('-__v');

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: populatedGoal,
      });
    } catch (error) {
      logger.error('Create goal error:', error);
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   GET /api/goals
// @desc    Get all goals for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { isCompleted } = req.query;
    const query = { createdBy: req.user._id };

    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted === 'true';
    }

    const goals = await Goal.find(query)
      .populate('createdBy', 'name email')
      .select('-__v')
      .sort({ targetDate: 1 });

    // Add progress percentage to each goal
    const goalsWithProgress = goals.map((goal) => {
      const progress = goal.targetAmount > 0 
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) 
        : 0;
      return {
        ...goal.toObject(),
        progressPercentage: Math.round(progress * 100) / 100,
      };
    });

    res.json({
      success: true,
      message: 'Goals retrieved successfully',
      data: goalsWithProgress,
    });
  } catch (error) {
      logger.error('Get goals error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   GET /api/goals/:id
// @desc    Get a single goal
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return sendErrorResponse(res, 404, 'Goal not found');
    }

    if (goal.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to view this goal');
    }

    const progress = goal.targetAmount > 0 
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) 
      : 0;

    const populatedGoal = await Goal.findById(goal._id)
      .populate('createdBy', 'name email')
      .select('-__v');

    res.json({
      success: true,
      message: 'Goal retrieved successfully',
      data: {
        ...populatedGoal.toObject(),
        progressPercentage: Math.round(progress * 100) / 100,
      },
    });
  } catch (error) {
      logger.error('Get goal error:', error);
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'Invalid goal ID');
    }
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   PATCH /api/goals/:id
// @desc    Update a goal
// @access  Private
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('targetAmount').optional().isFloat({ min: 0, max: 999999999 }).withMessage('Target amount must be between 0 and 999,999,999'),
    body('currentAmount').optional().isFloat({ min: 0, max: 999999999 }).withMessage('Current amount must be between 0 and 999,999,999'),
    body('targetDate').optional().isISO8601().withMessage('Target date must be a valid ISO date'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('isCompleted').optional().isBoolean().withMessage('isCompleted must be a boolean'),
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
      const goal = await Goal.findById(req.params.id);

      if (!goal) {
        return sendErrorResponse(res, 404, 'Goal not found');
      }

      if (goal.createdBy.toString() !== req.user._id.toString()) {
        return sendErrorResponse(res, 403, 'Not authorized to update this goal');
      }

      Object.keys(req.body).forEach((key) => {
        goal[key] = req.body[key];
      });

      // Check completion status
      goal.checkCompletion();
      await goal.save();

      const progress = goal.targetAmount > 0 
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) 
        : 0;

      const populatedGoal = await Goal.findById(goal._id)
        .populate('createdBy', 'name email')
        .select('-__v');

      res.json({
        success: true,
        message: 'Goal updated successfully',
        data: {
          ...populatedGoal.toObject(),
          progressPercentage: Math.round(progress * 100) / 100,
        },
      });
    } catch (error) {
      logger.error('Update goal error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid goal ID');
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return sendErrorResponse(res, 404, 'Goal not found');
    }

    if (goal.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to delete this goal');
    }

    await Goal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
      logger.error('Delete goal error:', error);
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'Invalid goal ID');
    }
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

