const logger = require('./logger');

// Standardized error response helper
const sendErrorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Log error for server-side debugging
  if (statusCode >= 500) {
    logger.error(`Error ${statusCode}: ${message}`, { errors });
  } else if (statusCode >= 400) {
    logger.warn(`Client error ${statusCode}: ${message}`, { errors });
  }

  return res.status(statusCode).json(response);
};

// MongoDB duplicate key error handler
const handleMongoError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      statusCode: 400,
    };
  }
  return null;
};

module.exports = { sendErrorResponse, handleMongoError };

