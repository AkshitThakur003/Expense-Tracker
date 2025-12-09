const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const { checkBudgetAlerts, checkGoalAchievements } = require('./notificationService');

// Calculate next recurring date based on frequency
const calculateNextDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

// Process recurring transactions
const processRecurringTransactions = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find transactions that need to be processed today
    const recurringTransactions = await Transaction.find({
      recurring: true,
      nextRecurringDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    console.log(`Processing ${recurringTransactions.length} recurring transactions...`);

    for (const transaction of recurringTransactions) {
      // Create new transaction
      const newTransaction = await Transaction.create({
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: new Date(),
        recurring: true,
        recurringFrequency: transaction.recurringFrequency || 'monthly',
        nextRecurringDate: calculateNextDate(new Date(), transaction.recurringFrequency || 'monthly'),
        note: transaction.note,
        createdBy: transaction.createdBy,
      });

      // Update original transaction's next recurring date
      transaction.nextRecurringDate = calculateNextDate(
        transaction.nextRecurringDate || transaction.date,
        transaction.recurringFrequency || 'monthly'
      );
      await transaction.save();

      console.log(`Created recurring transaction: ${newTransaction._id}`);
    }

    console.log('Recurring transactions processed successfully');
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
  }
};

// Schedule job to run daily at midnight
const startRecurringTransactionScheduler = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running recurring transactions scheduler...');
    processRecurringTransactions();
    checkBudgetAlerts();
    checkGoalAchievements();
  });

  // Also check alerts every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('Checking budget alerts and goal achievements...');
    checkBudgetAlerts();
    checkGoalAchievements();
  });

  console.log('✅ Recurring transactions scheduler started (runs daily at midnight)');
  console.log('✅ Notification service started (checks every 6 hours)');
};

module.exports = {
  processRecurringTransactions,
  startRecurringTransactionScheduler,
  calculateNextDate,
};

