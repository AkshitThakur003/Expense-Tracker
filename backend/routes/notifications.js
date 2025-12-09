const express = require('express');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');
const { sendEmail, sendBudgetAlert, sendGoalAchievement, sendMonthlyReport } = require('../services/emailService');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const { sendErrorResponse } = require('../utils/errorHandler');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   POST /api/notifications/test
// @desc    Send a test email
// @access  Private
router.post('/test', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return sendErrorResponse(res, 400, 'User email not found');
    }

    const result = await sendEmail(
      user.email,
      'Test Email from Expense Tracker',
      '<h2>Test Email</h2><p>This is a test email from your Expense Tracker application.</p>',
      'This is a test email from your Expense Tracker application.'
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.skipped 
          ? 'Email service not configured. Check SMTP settings in .env file.'
          : 'Test email sent successfully',
        skipped: result.skipped,
      });
    } else {
      return sendErrorResponse(res, 500, result.error || 'Failed to send test email');
    }
  } catch (error) {
    logger.error('Send test email error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   POST /api/notifications/budget-alert/:budgetId
// @desc    Manually trigger budget alert email
// @access  Private
router.post('/budget-alert/:budgetId', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId);
    
    if (!budget) {
      return sendErrorResponse(res, 404, 'Budget not found');
    }

    if (budget.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized');
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return sendErrorResponse(res, 400, 'User email not found');
    }

    // Calculate spending
    const transactions = await Transaction.aggregate([
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

    const spent = transactions.length > 0 ? transactions[0].total : 0;
    const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    const result = await sendBudgetAlert(user, {
      ...budget.toObject(),
      spent,
      remaining: budget.amount - spent,
      percentageUsed,
      isOverBudget: spent > budget.amount,
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.skipped 
          ? 'Email service not configured'
          : 'Budget alert email sent successfully',
        skipped: result.skipped,
      });
    } else {
      return sendErrorResponse(res, 500, result.error || 'Failed to send email');
    }
  } catch (error) {
    logger.error('Send budget alert error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   POST /api/notifications/monthly-report
// @desc    Send monthly report email
// @access  Private
router.post('/monthly-report', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return sendErrorResponse(res, 400, 'User email not found');
    }

    // Get current month transactions
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      createdBy: req.user._id,
      date: { $gte: start, $lte: end },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    const result = await sendMonthlyReport(user, {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.skipped 
          ? 'Email service not configured'
          : 'Monthly report email sent successfully',
        skipped: result.skipped,
      });
    } else {
      return sendErrorResponse(res, 500, result.error || 'Failed to send email');
    }
  } catch (error) {
    logger.error('Send monthly report error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   POST /api/notifications/push/subscribe
// @desc    Subscribe to push notifications
// @access  Private
router.post('/push/subscribe', async (req, res) => {
  try {
    const { endpoint, keys, notificationPreferences } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return sendErrorResponse(res, 400, 'Invalid push subscription data');
    }

    // Check if subscription already exists
    let subscription = await PushSubscription.findOne({ endpoint });

    if (subscription) {
      // Update existing subscription
      subscription.keys = keys;
      subscription.user = req.user._id;
      subscription.isActive = true;
      if (notificationPreferences) {
        subscription.notificationPreferences = {
          ...subscription.notificationPreferences,
          ...notificationPreferences,
        };
      }
      await subscription.save();
    } else {
      // Create new subscription
      subscription = await PushSubscription.create({
        endpoint,
        keys,
        user: req.user._id,
        notificationPreferences: notificationPreferences || {
          budgetAlerts: true,
          goalAchievements: true,
          monthlyReports: true,
          spendingAlerts: true,
        },
      });
    }

    res.json({
      success: true,
      message: 'Push notification subscription saved successfully',
      data: subscription,
    });
  } catch (error) {
    logger.error('Push subscription error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   DELETE /api/notifications/push/unsubscribe
// @desc    Unsubscribe from push notifications
// @access  Private
router.delete('/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return sendErrorResponse(res, 400, 'Endpoint is required');
    }

    const subscription = await PushSubscription.findOne({
      endpoint,
      user: req.user._id,
    });

    if (!subscription) {
      return sendErrorResponse(res, 404, 'Subscription not found');
    }

    await PushSubscription.findByIdAndDelete(subscription._id);

    res.json({
      success: true,
      message: 'Push notification subscription removed successfully',
    });
  } catch (error) {
    logger.error('Push unsubscribe error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   GET /api/notifications/push/subscription
// @desc    Get user's push notification subscription
// @access  Private
router.get('/push/subscription', async (req, res) => {
  try {
    const subscription = await PushSubscription.findOne({
      user: req.user._id,
      isActive: true,
    }).select('-keys -__v');

    res.json({
      success: true,
      data: subscription || null,
    });
  } catch (error) {
    logger.error('Get push subscription error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   PATCH /api/notifications/push/preferences
// @desc    Update push notification preferences
// @access  Private
router.patch('/push/preferences', async (req, res) => {
  try {
    const { notificationPreferences } = req.body;

    const subscription = await PushSubscription.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!subscription) {
      return sendErrorResponse(res, 404, 'No active push subscription found');
    }

    if (notificationPreferences) {
      subscription.notificationPreferences = {
        ...subscription.notificationPreferences,
        ...notificationPreferences,
      };
      await subscription.save();
    }

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: subscription,
    });
  } catch (error) {
    logger.error('Update push preferences error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

