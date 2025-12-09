const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { sendErrorResponse, handleMongoError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('amount').isFloat({ min: 0, max: 999999999 }).withMessage('Amount must be between 0 and 999,999,999'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date').custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
    body('recurring').optional().isBoolean().withMessage('Recurring must be a boolean'),
    body('note').optional().trim().isLength({ max: 1000 }).withMessage('Note must be less than 1000 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
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
      // Validate tags belong to user if provided
      if (req.body.tags && Array.isArray(req.body.tags) && req.body.tags.length > 0) {
        const Tag = require('../models/Tag');
        const userTags = await Tag.find({
          _id: { $in: req.body.tags },
          createdBy: req.user._id,
        });
        
        if (userTags.length !== req.body.tags.length) {
          return sendErrorResponse(res, 400, 'One or more tags do not exist or do not belong to you');
        }
      }

      const transaction = await Transaction.create({
        ...req.body,
        createdBy: req.user._id,
      });

      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('createdBy', 'name email')
        .populate('tags', 'name color')
        .select('-__v');

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: populatedTransaction,
      });
    } catch (error) {
      logger.error('Create transaction error:', error);
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics for the authenticated user
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const query = { createdBy: req.user._id };

    // Use aggregation pipeline for better performance
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    stats.forEach((stat) => {
      if (stat._id === 'income') {
        totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        totalExpense = stat.total;
      }
    });

    const balance = totalIncome - totalExpense;

    // Top categories breakdown (for expenses) using aggregation
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          ...query,
          type: 'expense',
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { amount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const topCategories = categoryBreakdown.map((item) => ({
      category: item._id,
      amount: item.amount,
    }));

    // Monthly expense data grouped by month using aggregation
    const monthlyExpenseData = await Transaction.aggregate([
      {
        $match: {
          ...query,
          type: 'expense',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const monthlyData = monthlyExpenseData.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1);
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      return {
        month: monthLabel,
        amount: item.amount,
        sortKey: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      };
    });

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalIncome,
        totalExpense,
        balance,
        topCategories,
        monthlyExpenseData: monthlyData,
      },
    });
    } catch (error) {
      logger.error('Get stats error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
});

// @route   GET /api/transactions
// @desc    Get all transactions for the authenticated user with filtering, search, and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      startDate, 
      endDate, 
      sortBy = '-date', 
      limit, 
      page = 1,
      search 
    } = req.query;

    // Build query
    const query = { createdBy: req.user._id };

    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Search functionality - search in title, category, and note
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { note: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Build sort
    const sortOptions = {};
    const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
    const sortOrder = sortBy.startsWith('-') ? -1 : 1;
    sortOptions[sortField] = sortOrder;

    // Pagination with limits
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50)); // Max 100, min 1
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .populate('createdBy', 'name email')
      .populate('tags', 'name color')
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
    } catch (error) {
      logger.error('Get transactions error:', error);
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
});

// @route   PATCH /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('amount').optional().isFloat({ min: 0, max: 999999999 }).withMessage('Amount must be between 0 and 999,999,999'),
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty').isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date').custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
    body('recurring').optional().isBoolean().withMessage('Recurring must be a boolean'),
    body('note').optional().trim().isLength({ max: 1000 }).withMessage('Note must be less than 1000 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
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
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return sendErrorResponse(res, 404, 'Transaction not found');
      }

      // Check if user owns the transaction
      if (transaction.createdBy.toString() !== req.user._id.toString()) {
        return sendErrorResponse(res, 403, 'Not authorized to update this transaction');
      }

      // Validate tags belong to user if provided
      if (req.body.tags && Array.isArray(req.body.tags) && req.body.tags.length > 0) {
        const Tag = require('../models/Tag');
        const userTags = await Tag.find({
          _id: { $in: req.body.tags },
          createdBy: req.user._id,
        });
        
        if (userTags.length !== req.body.tags.length) {
          return sendErrorResponse(res, 400, 'One or more tags do not exist or do not belong to you');
        }
      }

      // Update transaction
      Object.keys(req.body).forEach((key) => {
        transaction[key] = req.body[key];
      });

      await transaction.save();

      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('createdBy', 'name email')
        .populate('tags', 'name color')
        .select('-__v');

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: populatedTransaction,
      });
    } catch (error) {
      logger.error('Update transaction error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid transaction ID');
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return sendErrorResponse(res, 404, 'Transaction not found');
    }

    // Check if user owns the transaction
    if (transaction.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to delete this transaction');
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
    } catch (error) {
      logger.error('Delete transaction error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid transaction ID');
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
});

module.exports = router;

