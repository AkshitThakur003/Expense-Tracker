const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      version: '1.0.0',
      description: 'A comprehensive expense tracking API with authentication, transactions, budgets, goals, and analytics',
      contact: {
        name: 'API Support',
        email: 'support@expensetracker.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date' },
            recurring: { type: 'boolean' },
            note: { type: 'string' },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            amount: { type: 'number' },
            period: { type: 'string', enum: ['monthly', 'yearly'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            alertThreshold: { type: 'number', minimum: 0, maximum: 100 },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            targetAmount: { type: 'number' },
            currentAmount: { type: 'number' },
            targetDate: { type: 'string', format: 'date' },
            category: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

