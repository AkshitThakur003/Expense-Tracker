const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { sendErrorResponse, handleMongoError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post(
  '/',
  [
    body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('amount').isFloat({ min: 0, max: 999999999 }).withMessage('Amount must be between 0 and 999,999,999'),
    body('period').isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('alertThreshold').optional().isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100'),
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
      const { startDate, endDate, category } = req.body;
      
      // Validate date range
      if (new Date(startDate) >= new Date(endDate)) {
        return sendErrorResponse(res, 400, 'End date must be after start date');
      }

      // Check for overlapping budgets in the same category
      const overlappingBudget = await Budget.findOne({
        createdBy: req.user._id,
        category: category.trim(),
        isActive: true,
        $or: [
          {
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) },
          },
        ],
      });

      if (overlappingBudget) {
        return sendErrorResponse(
          res,
          400,
          'An active budget already exists for this category in the specified date range'
        );
      }

      const budget = await Budget.create({
        ...req.body,
        createdBy: req.user._id,
      });

      const populatedBudget = await Budget.findById(budget._id)
        .populate('createdBy', 'name email')
        .select('-__v');

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: populatedBudget,
      });
    } catch (error) {
      logger.error('Create budget error:', error);
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   GET /api/budgets
// @desc    Get all budgets for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { isActive, category } = req.query;
    const query = { createdBy: req.user._id };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category) {
      query.category = category;
    }

    const budgets = await Budget.find(query)
      .populate('createdBy', 'name email')
      .select('-__v')
      .sort({ createdAt: -1 });

    // Optimize: Batch calculate spending for all budgets using Promise.all
    // Group budgets by category to reduce queries
    if (budgets.length === 0) {
      return res.json({
        success: true,
        message: 'Budgets retrieved successfully',
        data: [],
      });
    }

    // Calculate spending for all budgets in parallel
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const actualSpending = await Transaction.aggregate([
          {
            $match: {
              createdBy: req.user._id,
              type: 'expense',
              category: budget.category,
              date: {
                $gte: new Date(budget.startDate),
                $lte: new Date(budget.endDate),
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const spent = actualSpending.length > 0 ? actualSpending[0].total : 0;
        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const isOverBudget = spent > budget.amount;
        const shouldAlert = percentageUsed >= budget.alertThreshold;

        return {
          ...budget.toObject(),
          spent,
          remaining,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          isOverBudget,
          shouldAlert,
        };
      })
    );

      res.json({
        success: true,
        message: 'Budgets retrieved successfully',
        data: budgetsWithSpending,
      });
    } catch (error) {
      logger.error('Get budgets error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
});

// @route   GET /api/budgets/:id
// @desc    Get a single budget with detailed spending
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return sendErrorResponse(res, 404, 'Budget not found');
    }

    if (budget.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to view this budget');
    }

    // Calculate actual spending
    const actualSpending = await Transaction.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          type: 'expense',
          category: budget.category,
          date: {
            $gte: new Date(budget.startDate),
            $lte: new Date(budget.endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const spent = actualSpending.length > 0 ? actualSpending[0].total : 0;
    const transactionCount = actualSpending.length > 0 ? actualSpending[0].count : 0;
    const remaining = budget.amount - spent;
    const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const isOverBudget = spent > budget.amount;
    const shouldAlert = percentageUsed >= budget.alertThreshold;

    // Get transactions for this budget
    const transactions = await Transaction.find({
      createdBy: req.user._id,
      type: 'expense',
      category: budget.category,
      date: {
        $gte: new Date(budget.startDate),
        $lte: new Date(budget.endDate),
      },
    })
      .sort({ date: -1 })
      .select('-__v')
      .limit(50);

    const populatedBudget = await Budget.findById(budget._id)
      .populate('createdBy', 'name email')
      .select('-__v');

    res.json({
      success: true,
      message: 'Budget retrieved successfully',
      data: {
        ...populatedBudget.toObject(),
        spent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        isOverBudget,
        shouldAlert,
        transactionCount,
        transactions,
      },
    });
    } catch (error) {
      logger.error('Get budget error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid budget ID');
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
});

// @route   PATCH /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.patch(
  '/:id',
  [
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty').isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('amount').optional().isFloat({ min: 0, max: 999999999 }).withMessage('Amount must be between 0 and 999,999,999'),
    body('period').optional().isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
    body('alertThreshold').optional().isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
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
      const budget = await Budget.findById(req.params.id);

      if (!budget) {
        return sendErrorResponse(res, 404, 'Budget not found');
      }

      if (budget.createdBy.toString() !== req.user._id.toString()) {
        return sendErrorResponse(res, 403, 'Not authorized to update this budget');
      }

      // Validate date range if both dates are being updated
      if (req.body.startDate && req.body.endDate) {
        if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
          return sendErrorResponse(res, 400, 'End date must be after start date');
        }
      }

      // Check for overlapping budgets if category or dates are being updated
      if (req.body.category || req.body.startDate || req.body.endDate) {
        const checkCategory = req.body.category || budget.category;
        const checkStartDate = req.body.startDate || budget.startDate;
        const checkEndDate = req.body.endDate || budget.endDate;

        const overlappingBudget = await Budget.findOne({
          _id: { $ne: budget._id },
          createdBy: req.user._id,
          category: checkCategory.trim(),
          isActive: true,
          $or: [
            {
              startDate: { $lte: new Date(checkEndDate) },
              endDate: { $gte: new Date(checkStartDate) },
            },
          ],
        });

        if (overlappingBudget) {
          return sendErrorResponse(
            res,
            400,
            'An active budget already exists for this category in the specified date range'
          );
        }
      }

      Object.keys(req.body).forEach((key) => {
        budget[key] = req.body[key];
      });

      await budget.save();

      const populatedBudget = await Budget.findById(budget._id)
        .populate('createdBy', 'name email')
        .select('-__v');

      res.json({
        success: true,
        message: 'Budget updated successfully',
        data: populatedBudget,
      });
    } catch (error) {
      logger.error('Update budget error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid budget ID');
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return sendErrorResponse(res, 404, 'Budget not found');
    }

    if (budget.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to delete this budget');
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
    } catch (error) {
      logger.error('Delete budget error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid budget ID');
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
});

module.exports = router;

