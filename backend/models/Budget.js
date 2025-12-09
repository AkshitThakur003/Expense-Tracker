const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add a budget amount'],
    min: [0, 'Budget amount must be positive'],
  },
  period: {
    type: String,
    required: [true, 'Please specify budget period'],
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% of budget is used
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
budgetSchema.index({ createdBy: 1, category: 1 });
budgetSchema.index({ createdBy: 1, startDate: 1, endDate: 1 });
budgetSchema.index({ createdBy: 1, isActive: 1 });

module.exports = mongoose.model('Budget', budgetSchema);

