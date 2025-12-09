const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('./utils/logger');

// Load .env file from backend directory regardless of where server.js is called from
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Security middleware - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection attacks
app.use(mongoSanitize());

// Rate limiting configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true' || isDevelopment;

// General API rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => disableRateLimit, // Skip rate limiting if disabled
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '15', 10), // Limit each IP to 15 requests per windowMs (configurable)
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  skip: () => disableRateLimit, // Skip rate limiting if disabled
});

// Apply rate limiting middleware
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Log rate limiting status
if (disableRateLimit) {
  console.log('⚠️  Rate limiting DISABLED (Development mode or DISABLE_RATE_LIMIT=true)');
} else {
  console.log('✅ Rate limiting ENABLED');
}

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/protected', require('./routes/protected'));
app.use('/api/test', require('./routes/test'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/export', require('./routes/export'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/analytics', require('./routes/analytics'));

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mern-boilerplate';
    
    if (!mongoURI || mongoURI.includes('your-') || mongoURI.includes('username')) {
      console.error('❌ MongoDB URI is not configured properly!');
      console.error('   Please set MONGODB_URI in backend/.env file');
      process.exit(1);
    }

    // For MongoDB Atlas: Add database name if not present
    let connectionURI = mongoURI;
    if (mongoURI.includes('mongodb+srv://') && !mongoURI.includes('?') && !mongoURI.match(/\/[^\/]+\?/)) {
      // Add database name before query parameters
      const dbName = 'mern-boilerplate';
      if (!mongoURI.match(/\/[a-zA-Z]/)) {
        connectionURI = mongoURI.replace('mongodb.net/', `mongodb.net/${dbName}?`);
      }
    }

    // Mongoose 8.x: useNewUrlParser and useUnifiedTopology are no longer needed
    // Add connection timeout for better error handling
    await mongoose.connect(connectionURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
    });
    
    console.log('✅ MongoDB Connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    if (mongoose.connection.port) {
      console.log(`   Port: ${mongoose.connection.port}`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n📝 Troubleshooting tips:');
    
    // Specific error handling
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('   🔍 DNS Resolution Failed:');
      console.error('      - Check internet connection');
      console.error('      - Verify MongoDB Atlas cluster URL');
    } else if (error.message.includes('authentication failed')) {
      console.error('   🔍 Authentication Failed:');
      console.error('      - Check username/password in connection string');
      console.error('      - Verify database user exists in MongoDB Atlas');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('   🔍 IP Address Not Whitelisted:');
      console.error('      1. Go to MongoDB Atlas → Network Access');
      console.error('      2. Click "Add IP Address"');
      console.error('      3. Add your IP or use 0.0.0.0/0 (dev only)');
    } else if (error.message.includes('timeout')) {
      console.error('   🔍 Connection Timeout:');
      console.error('      - Check IP whitelist in MongoDB Atlas');
      console.error('      - Verify cluster is not paused');
      console.error('      - Check firewall settings');
    }
    
    console.error('\n   General checks:');
    console.error('   1. Verify MONGODB_URI in backend/.env file');
    console.error('   2. Ensure database name is in connection string');
    console.error('   3. Check MongoDB Atlas cluster status');
    console.error('   4. Run: node backend/test-mongo-connection.js (for detailed test)\n');
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

connectDB();

// Start recurring transactions scheduler
const { startRecurringTransactionScheduler } = require('./services/recurringTransactions');
startRecurringTransactionScheduler();

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment and not in Vercel serverless
// Vercel serverless functions don't need app.listen() - the handler is called directly
const isVercel = process.env.VERCEL === '1';
const isTest = process.env.NODE_ENV === 'test';

if (!isTest && !isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app for testing
module.exports = app;

