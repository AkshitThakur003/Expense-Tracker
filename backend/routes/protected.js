const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   GET /api/protected/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to protected route',
    data: {
      user: req.user,
      message: 'This is a protected route',
    },
  });
});

module.exports = router;

