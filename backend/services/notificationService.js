const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendBudgetAlert, sendGoalAchievement } = require('./emailService');

// Check and send budget alerts
const checkBudgetAlerts = async () => {
  try {
    const budgets = await Budget.find({ isActive: true });
    
    for (const budget of budgets) {
      const transactions = await Transaction.aggregate([
        {
          $match: {
            createdBy: budget.createdBy,
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
      const isOverBudget = spent > budget.amount;
      const shouldAlert = percentageUsed >= budget.alertThreshold;

      if (shouldAlert || isOverBudget) {
        const user = await User.findById(budget.createdBy);
        if (user && user.email) {
          await sendBudgetAlert(user, {
            ...budget.toObject(),
            spent,
            remaining: budget.amount - spent,
            percentageUsed,
            isOverBudget,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
};

// Check and send goal achievement notifications
const checkGoalAchievements = async () => {
  try {
    const goals = await Goal.find({ isCompleted: false });
    
    for (const goal of goals) {
      if (goal.currentAmount >= goal.targetAmount) {
        goal.isCompleted = true;
        await goal.save();

        const user = await User.findById(goal.createdBy);
        if (user && user.email) {
          await sendGoalAchievement(user, goal);
        }
      }
    }
  } catch (error) {
    console.error('Error checking goal achievements:', error);
  }
};

module.exports = {
  checkBudgetAlerts,
  checkGoalAchievements,
};

