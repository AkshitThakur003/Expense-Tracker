const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   GET /api/test/protected
// @desc    Test protected route
// @access  Private
router.get('/protected', (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed successfully',
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      timestamp: new Date().toISOString(),
      message: 'This is a test protected endpoint. Authentication is working correctly!',
    },
  });
});

module.exports = router;

