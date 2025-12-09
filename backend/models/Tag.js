const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a tag name'],
    trim: true,
    lowercase: true,
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Unique constraint: same user can't have duplicate tag names
tagSchema.index({ createdBy: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', tagSchema);

