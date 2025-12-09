const express = require('express');
const logger = require('../utils/logger');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');
const { sendErrorResponse } = require('../utils/errorHandler');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// Helper function to calculate average spending
const calculateAverage = (values) => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

// Helper function to calculate trend (simple linear regression)
const calculateTrend = (data) => {
  if (data.length < 2) return { trend: 'stable', percentage: 0 };
  
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  data.forEach((point, index) => {
    const x = index + 1;
    const y = point.amount;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgY = sumY / n;
  const percentage = avgY > 0 ? (slope / avgY) * 100 : 0;

  let trend = 'stable';
  if (percentage > 5) trend = 'increasing';
  else if (percentage < -5) trend = 'decreasing';

  return { trend, percentage: Math.round(percentage * 100) / 100 };
};

// @route   GET /api/analytics/predictions
// @desc    Get spending predictions and trends
// @access  Private
router.get('/predictions', async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get last 6 months of expense data
    const expenses = await Transaction.find({
      createdBy: req.user._id,
      type: 'expense',
      date: { $gte: sixMonthsAgo },
    }).sort({ date: 1 });

    // Group by month
    const monthlyData = {};
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          amount: 0,
          count: 0,
        };
      }
      monthlyData[monthKey].amount += expense.amount;
      monthlyData[monthKey].count += 1;
    });

    // Convert to array and sort
    const monthlyArray = Object.entries(monthlyData)
      .map(([key, value]) => ({
        ...value,
        sortKey: key,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Calculate predictions
    const predictions = {
      nextMonth: null,
      nextQuarter: null,
      trends: {},
    };

    if (monthlyArray.length >= 2) {
      const trend = calculateTrend(monthlyArray);
      const lastMonth = monthlyArray[monthlyArray.length - 1];
      const avgSpending = calculateAverage(monthlyArray.map(m => m.amount));

      // Predict next month (using trend)
      const predictedNextMonth = lastMonth.amount * (1 + trend.percentage / 100);
      predictions.nextMonth = {
        amount: Math.round(predictedNextMonth * 100) / 100,
        confidence: monthlyArray.length >= 3 ? 'high' : 'medium',
        trend: trend.trend,
        trendPercentage: trend.percentage,
        basedOn: `${monthlyArray.length} months of data`,
      };

      // Predict next quarter (3 months)
      const predictedQuarter = predictedNextMonth * 3;
      predictions.nextQuarter = {
        amount: Math.round(predictedQuarter * 100) / 100,
        confidence: monthlyArray.length >= 4 ? 'high' : 'medium',
        trend: trend.trend,
        trendPercentage: trend.percentage,
      };

      // Overall trend
      predictions.trends.overall = trend;
      predictions.trends.averageMonthly = Math.round(avgSpending * 100) / 100;
    }

    // Category-wise predictions
    const categoryData = {};
    expenses.forEach((expense) => {
      const category = expense.category;
      if (!categoryData[category]) {
        categoryData[category] = [];
      }
      categoryData[category].push(expense.amount);
    });

    const categoryPredictions = {};
    Object.entries(categoryData).forEach(([category, amounts]) => {
      if (amounts.length >= 2) {
        const avg = calculateAverage(amounts);
        const recentAvg = calculateAverage(amounts.slice(-3)); // Last 3 transactions
        const trend = recentAvg > avg * 1.1 ? 'increasing' : recentAvg < avg * 0.9 ? 'decreasing' : 'stable';
        
        categoryPredictions[category] = {
          predictedNextMonth: Math.round(recentAvg * 100) / 100,
          average: Math.round(avg * 100) / 100,
          trend,
          transactionCount: amounts.length,
        };
      }
    });

    res.json({
      success: true,
      data: {
        predictions,
        categoryPredictions,
        historicalData: monthlyArray,
        insights: generateInsights(monthlyArray, predictions),
      },
    });
  } catch (error) {
    logger.error('Analytics predictions error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// Generate insights based on data
const generateInsights = (monthlyData, predictions) => {
  const insights = [];

  if (monthlyData.length >= 3) {
    const lastMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    const change = ((lastMonth.amount - previousMonth.amount) / previousMonth.amount) * 100;

    if (Math.abs(change) > 10) {
      insights.push({
        type: change > 0 ? 'warning' : 'positive',
        message: change > 0
          ? `Your spending increased by ${Math.abs(change).toFixed(1)}% compared to last month`
          : `Great! Your spending decreased by ${Math.abs(change).toFixed(1)}% compared to last month`,
        icon: change > 0 ? 'trending-up' : 'trending-down',
      });
    }

    if (predictions.nextMonth && predictions.nextMonth.trend === 'increasing') {
      insights.push({
        type: 'warning',
        message: `Your spending trend is increasing. Consider reviewing your budgets.`,
        icon: 'alert',
      });
    }
  }

  // Budget insights
  if (monthlyData.length > 0) {
    const avgSpending = calculateAverage(monthlyData.map(m => m.amount));
    insights.push({
      type: 'info',
      message: `Your average monthly spending is ${avgSpending.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}`,
      icon: 'info',
    });
  }

  return insights;
};

// @route   GET /api/analytics/spending-patterns
// @desc    Analyze spending patterns
// @access  Private
router.get('/spending-patterns', async (req, res) => {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Transaction.find({
      createdBy: req.user._id,
      type: 'expense',
      date: { $gte: threeMonthsAgo },
    });

    // Day of week analysis
    const dayOfWeekSpending = {};
    expenses.forEach((expense) => {
      const day = new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayOfWeekSpending[day]) {
        dayOfWeekSpending[day] = { amount: 0, count: 0 };
      }
      dayOfWeekSpending[day].amount += expense.amount;
      dayOfWeekSpending[day].count += 1;
    });

    // Time of month analysis (first half vs second half)
    const timeOfMonthSpending = { firstHalf: 0, secondHalf: 0 };
    expenses.forEach((expense) => {
      const day = new Date(expense.date).getDate();
      if (day <= 15) {
        timeOfMonthSpending.firstHalf += expense.amount;
      } else {
        timeOfMonthSpending.secondHalf += expense.amount;
      }
    });

    // Most active spending day
    const dayOfWeekArray = Object.entries(dayOfWeekSpending)
      .map(([day, data]) => ({
        day,
        amount: data.amount,
        count: data.count,
        average: data.amount / data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        dayOfWeekBreakdown: dayOfWeekArray,
        timeOfMonthBreakdown: timeOfMonthSpending,
        mostActiveDay: dayOfWeekArray[0] || null,
        totalTransactions: expenses.length,
      },
    });
  } catch (error) {
    logger.error('Spending patterns error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

