const express = require('express');
const { body, validationResult } = require('express-validator');
const Tag = require('../models/Tag');
const { protect } = require('../middleware/auth');
const { sendErrorResponse, handleMongoError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   POST /api/tags
// @desc    Create a new tag
// @access  Private
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Tag name is required').isLength({ max: 50 }).withMessage('Tag name must be less than 50 characters'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(
        res,
        400,
        'Validation error',
        errors.array().map((err) => ({ field: err.param, message: err.msg }))
      );
    }

    try {
      const tag = await Tag.create({
        name: req.body.name.toLowerCase().trim(),
        color: req.body.color || '#3B82F6',
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        data: tag,
      });
    } catch (error) {
      logger.error('Create tag error:', error);
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   GET /api/tags
// @desc    Get all tags for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find({ createdBy: req.user._id })
      .sort({ name: 1 })
      .select('-__v');

    res.json({
      success: true,
      message: 'Tags retrieved successfully',
      data: tags,
    });
  } catch (error) {
      logger.error('Get tags error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   PATCH /api/tags/:id
// @desc    Update a tag
// @access  Private
router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Tag name cannot be empty').isLength({ max: 50 }).withMessage('Tag name must be less than 50 characters'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(
        res,
        400,
        'Validation error',
        errors.array().map((err) => ({ field: err.param, message: err.msg }))
      );
    }

    try {
      const tag = await Tag.findById(req.params.id);

      if (!tag) {
        return sendErrorResponse(res, 404, 'Tag not found');
      }

      if (tag.createdBy.toString() !== req.user._id.toString()) {
        return sendErrorResponse(res, 403, 'Not authorized to update this tag');
      }

      if (req.body.name) {
        tag.name = req.body.name.toLowerCase().trim();
      }
      if (req.body.color) {
        tag.color = req.body.color;
      }

      await tag.save();

      res.json({
        success: true,
        message: 'Tag updated successfully',
        data: tag,
      });
    } catch (error) {
      logger.error('Update tag error:', error);
      if (error.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid tag ID');
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        return sendErrorResponse(res, mongoError.statusCode, mongoError.message);
      }
      return sendErrorResponse(res, 500, 'Server error. Please try again later.');
    }
  }
);

// @route   DELETE /api/tags/:id
// @desc    Delete a tag
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return sendErrorResponse(res, 404, 'Tag not found');
    }

    if (tag.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to delete this tag');
    }

    await Tag.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
      logger.error('Delete tag error:', error);
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'Invalid tag ID');
    }
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

