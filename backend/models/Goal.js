const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a goal title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  targetAmount: {
    type: Number,
    required: [true, 'Please add a target amount'],
    min: [0, 'Target amount must be positive'],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative'],
  },
  targetDate: {
    type: Date,
    required: [true, 'Please add a target date'],
  },
  category: {
    type: String,
    trim: true,
    default: 'Savings',
  },
  isCompleted: {
    type: Boolean,
    default: false,
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
goalSchema.index({ createdBy: 1, targetDate: 1 });
goalSchema.index({ createdBy: 1, isCompleted: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Method to check if goal is completed
goalSchema.methods.checkCompletion = function() {
  if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
    this.isCompleted = true;
    return true;
  }
  if (this.currentAmount < this.targetAmount && this.isCompleted) {
    this.isCompleted = false;
    return false;
  }
  return null;
};

module.exports = mongoose.model('Goal', goalSchema);

