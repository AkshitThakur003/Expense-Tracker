// Vercel serverless function entry point
// This file wraps the Express app for Vercel's serverless environment

// Prevent the server from starting in Vercel's serverless environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the Express app (server.js exports the app)
const app = require('../backend/server');

// Export the app for Vercel's serverless function handler
module.exports = app;

