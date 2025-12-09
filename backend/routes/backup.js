const express = require('express');
const logger = require('../utils/logger');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Tag = require('../models/Tag');
const { protect } = require('../middleware/auth');
const { sendErrorResponse } = require('../utils/errorHandler');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   GET /api/backup/export
// @desc    Export all user data as backup
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user data
    const transactions = await Transaction.find({ createdBy: userId }).select('-__v');
    const budgets = await Budget.find({ createdBy: userId }).select('-__v');
    const goals = await Goal.find({ createdBy: userId }).select('-__v');
    const tags = await Tag.find({ createdBy: userId }).select('-__v');

    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        id: userId.toString(),
        name: req.user.name,
        email: req.user.email,
      },
      data: {
        transactions,
        budgets,
        goals,
        tags,
      },
      summary: {
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        tags: tags.length,
      },
    };

    res.json({
      success: true,
      message: 'Backup exported successfully',
      data: backup,
    });
  } catch (error) {
    logger.error('Export backup error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   POST /api/backup/import
// @desc    Import user data from backup
// @access  Private
router.post('/import', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.transactions || !data.budgets || !data.goals || !data.tags) {
      return sendErrorResponse(res, 400, 'Invalid backup data format');
    }

    const userId = req.user._id;
    const results = {
      transactions: { success: 0, errors: 0 },
      budgets: { success: 0, errors: 0 },
      goals: { success: 0, errors: 0 },
      tags: { success: 0, errors: 0 },
    };

    // Import transactions
    for (const transaction of data.transactions) {
      try {
        await Transaction.create({
          ...transaction,
          createdBy: userId,
          _id: undefined, // Let MongoDB generate new IDs
        });
        results.transactions.success++;
      } catch (error) {
        results.transactions.errors++;
      }
    }

    // Import budgets
    for (const budget of data.budgets) {
      try {
        await Budget.create({
          ...budget,
          createdBy: userId,
          _id: undefined,
        });
        results.budgets.success++;
      } catch (error) {
        results.budgets.errors++;
      }
    }

    // Import goals
    for (const goal of data.goals) {
      try {
        await Goal.create({
          ...goal,
          createdBy: userId,
          _id: undefined,
        });
        results.goals.success++;
      } catch (error) {
        results.goals.errors++;
      }
    }

    // Import tags
    for (const tag of data.tags) {
      try {
        await Tag.create({
          ...tag,
          createdBy: userId,
          _id: undefined,
        });
        results.tags.success++;
      } catch (error) {
        results.tags.errors++;
      }
    }

    res.json({
      success: true,
      message: 'Backup imported successfully',
      data: results,
    });
  } catch (error) {
    logger.error('Import backup error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

