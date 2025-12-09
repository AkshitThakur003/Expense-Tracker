const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');
const { sendErrorResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'weekly':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      end = new Date(now);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'all':
      // Return null to indicate no date filtering
      return { start: null, end: null };
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// @route   GET /api/reports/:period
// @desc    Get report for a specific period (weekly, monthly, yearly)
// @access  Private
router.get('/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { startDate, endDate } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(period);
      start = range.start;
      end = range.end;
    }

    // Build query - if start and end are null, get all transactions
    const query = {
      createdBy: req.user._id,
    };

    if (start !== null && end !== null) {
      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    // Get transactions in date range (or all if no date range)
    const transactions = await Transaction.find(query)
      .populate('tags', 'name color')
      .sort({ date: -1 });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};
    const dailyBreakdown = {};
    const tagBreakdown = {};

    transactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];

      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;

        // Category breakdown
        if (!categoryBreakdown[transaction.category]) {
          categoryBreakdown[transaction.category] = 0;
        }
        categoryBreakdown[transaction.category] += transaction.amount;

        // Daily breakdown
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = { income: 0, expense: 0 };
        }
        dailyBreakdown[dateKey].expense += transaction.amount;

        // Tag breakdown
        if (transaction.tags && transaction.tags.length > 0) {
          transaction.tags.forEach((tag) => {
            if (!tagBreakdown[tag.name]) {
              tagBreakdown[tag.name] = 0;
            }
            tagBreakdown[tag.name] += transaction.amount;
          });
        }
      }

      // Daily breakdown for income
      if (transaction.type === 'income') {
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = { income: 0, expense: 0 };
        }
        dailyBreakdown[dateKey].income += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // Convert category breakdown to array
    const categoryData = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Convert daily breakdown to array and sort
    const dailyData = Object.entries(dailyBreakdown)
      .map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Convert tag breakdown to array
    const tagData = Object.entries(tagBreakdown)
      .map(([tag, amount]) => ({ tag, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Get active budgets and check status
    const budgetQuery = {
      createdBy: req.user._id,
      isActive: true,
    };

    if (start !== null && end !== null) {
      budgetQuery.startDate = { $lte: end };
      budgetQuery.endDate = { $gte: start };
    }

    const budgets = await Budget.find(budgetQuery);

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const budgetTransactionQuery = {
          createdBy: req.user._id,
          type: 'expense',
          category: budget.category,
        };

        if (start !== null && end !== null) {
          budgetTransactionQuery.date = {
            $gte: new Date(Math.max(start, budget.startDate)),
            $lte: new Date(Math.min(end, budget.endDate)),
          };
        } else {
          // For "all" period, use budget's date range
          budgetTransactionQuery.date = {
            $gte: budget.startDate,
            $lte: budget.endDate,
          };
        }

        const budgetTransactions = await Transaction.find(budgetTransactionQuery);

        const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          category: budget.category,
          budget: budget.amount,
          spent,
          remaining: budget.amount - spent,
          percentage: Math.round(percentage * 100) / 100,
          isOverBudget: spent > budget.amount,
        };
      })
    );

    // Top transactions
    const topExpenses = transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((t) => ({
        id: t._id,
        title: t.title,
        amount: t.amount,
        category: t.category,
        date: t.date,
      }));

    const topIncomes = transactions
      .filter((t) => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((t) => ({
        id: t._id,
        title: t.title,
        amount: t.amount,
        category: t.category,
        date: t.date,
      }));

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        period,
        dateRange: start !== null && end !== null ? {
          start: start.toISOString(),
          end: end.toISOString(),
        } : null,
        summary: {
          totalIncome,
          totalExpense,
          balance,
          transactionCount: transactions.length,
        },
        categoryBreakdown: categoryData,
        dailyBreakdown: dailyData,
        tagBreakdown: tagData,
        budgetStatus,
        topExpenses,
        topIncomes,
      },
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

