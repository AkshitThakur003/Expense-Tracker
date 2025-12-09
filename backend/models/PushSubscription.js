const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: [true, 'Push subscription endpoint is required'],
    unique: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notificationPreferences: {
    budgetAlerts: {
      type: Boolean,
      default: true,
    },
    goalAchievements: {
      type: Boolean,
      default: true,
    },
    monthlyReports: {
      type: Boolean,
      default: true,
    },
    spendingAlerts: {
      type: Boolean,
      default: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
pushSubscriptionSchema.index({ user: 1 });
// Note: endpoint already has a unique index from unique: true constraint

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);

