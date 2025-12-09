# 💰 Expense Tracker - Full-Stack MERN Application

A comprehensive expense tracking application built with the MERN stack (MongoDB, Express, React, Node.js). Track your income, expenses, budgets, goals, and get detailed insights into your financial habits.

[![MERN Stack](https://img.shields.io/badge/MERN-Stack-00D9FF?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** with access and refresh tokens
- Secure password hashing with bcryptjs
- Automatic token refresh via axios interceptors
- Protected routes on both frontend and backend
- **Rate limiting** to prevent abuse
- **Helmet** security headers
- **Input sanitization** against NoSQL injection
- Strong password policies (min 8 chars, uppercase, lowercase, number)

### 💵 Transaction Management
- **Income & Expense Tracking**
  - Add, edit, delete transactions
  - Categorize transactions
  - Add notes and tags
  - Date-based filtering
  - Search functionality (title, category, notes)
  - Pagination support
  - Bulk operations (delete multiple)
  
- **Recurring Transactions**
  - Set up automatic recurring transactions
  - Supports daily, weekly, monthly, yearly frequencies
  - Automatic transaction creation via scheduler

### 📊 Budget Management
- Create budgets by category
- Monthly and yearly budget periods
- Real-time spending tracking
- Visual progress indicators
- Alert thresholds (notify when X% spent)
- Budget vs actual comparison
- Over-budget warnings

### 🎯 Financial Goals
- Set savings/spending goals
- Track progress with visual progress bars
- Target date tracking
- Days remaining/overdue indicators
- Filter by active/completed goals
- Automatic completion detection

### 📈 Analytics & Insights
- **Dashboard Overview**
  - Total income, expenses, and balance
  - Category-wise breakdown
  - Monthly expense trends
  - Budget alerts
  - Goal progress summary
  
- **Advanced Analytics**
  - Spending predictions
  - Trend analysis
  - Category insights
  - Monthly comparisons

### 📋 Reports
- **Monthly/Yearly Reports**
  - Income vs expense summary
  - Category breakdowns
  - Budget performance
  - Top expenses
  - Top income sources
  - Visual charts (Line & Bar charts)

### 💱 Currency Support
- **Multi-Currency Support**
  - 9 supported currencies: INR, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY
  - User currency preference
  - Real-time exchange rates
  - Currency converter tool
  - Automatic currency formatting
  - Exchange rate caching (1 hour)

### 📤 Export & Import
- **CSV Export** - Export transactions with filters
- **PDF Export** - Professional PDF reports with summaries
- **CSV Import** - Bulk import transactions from CSV
- Duplicate detection during import

### 🏷️ Tags System
- Create custom tags with colors
- Tag transactions for better organization
- Filter transactions by tags
- Tag management interface

### 🔔 Notifications
- Budget alerts
- Goal reminders
- Email notifications (ready for integration)

### 🎨 User Interface
- **Modern, Responsive Design**
  - Dark mode support
  - Mobile-friendly layout
  - Smooth animations (Framer Motion)
  - Toast notifications
  - Loading states
  - Skeleton loaders
  
- **Components**
  - Interactive charts (Recharts)
  - Searchable dropdowns
  - Modal dialogs
  - Form validation
  - Error boundaries

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Expense-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

   Create a `.env` file in the `frontend` directory (optional):
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running locally or update `MONGODB_URI` with your MongoDB Atlas connection string.

5. **Run the application:**
   ```bash
   npm run dev
   ```
   
   This starts both servers concurrently:
   - 🔵 **BACKEND** - http://localhost:5000
   - 🟢 **FRONTEND** - http://localhost:3000

   Or run them separately:
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

## 📁 Project Structure

```
Expense-Tracker/
├── backend/
│   ├── config/
│   │   └── swagger.js          # API documentation
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Transaction.js      # Transaction model
│   │   ├── Budget.js            # Budget model
│   │   ├── Goal.js              # Goal model
│   │   └── Tag.js               # Tag model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── transactions.js     # Transaction CRUD
│   │   ├── budgets.js           # Budget management
│   │   ├── goals.js             # Goals management
│   │   ├── tags.js              # Tags management
│   │   ├── reports.js           # Reports generation
│   │   ├── analytics.js        # Analytics & insights
│   │   ├── export.js            # Export/Import
│   │   ├── currency.js          # Currency conversion
│   │   ├── notifications.js    # Notifications
│   │   ├── backup.js            # Data backup
│   │   └── protected.js        # Protected user routes
│   ├── services/
│   │   └── recurringTransactions.js  # Recurring transaction scheduler
│   ├── utils/
│   │   ├── generateToken.js     # JWT token generation
│   │   ├── errorHandler.js      # Error handling
│   │   ├── logger.js            # Winston logger
│   │   └── currencyConverter.js # Currency conversion logic
│   ├── server.js                # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── FormField.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── TransactionCard.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   └── ...
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── CurrencyConverter.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── hooks/
│   │   │   └── useCurrency.js   # Currency hook
│   │   ├── redux/               # Redux store
│   │   │   ├── slices/
│   │   │   │   └── authSlice.js
│   │   │   └── store.js
│   │   ├── utils/
│   │   │   ├── axios.js         # Axios instance
│   │   │   └── currency.js      # Currency utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── .eslintrc.json
├── .prettierrc
└── package.json
```

## 🔑 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/logout` - Logout user (Protected)

### Transactions (`/api/transactions`)
- `GET /api/transactions` - Get all transactions (with filters, search, pagination)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get single transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `DELETE /api/transactions` - Bulk delete transactions
- `GET /api/transactions/stats` - Get transaction statistics

### Budgets (`/api/budgets`)
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get single budget
- `PATCH /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Goals (`/api/goals`)
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get single goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Reports (`/api/reports`)
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/yearly` - Yearly report
- `GET /api/reports/custom` - Custom date range report

### Analytics (`/api/analytics`)
- `GET /api/analytics/predictions` - Spending predictions
- `GET /api/analytics/trends` - Trend analysis

### Currency (`/api/currency`)
- `GET /api/currency/rates` - Get exchange rates
- `POST /api/currency/convert` - Convert currency
- `POST /api/currency/refresh` - Refresh exchange rates
- `GET /api/currency/symbols` - Get currency symbols
- `GET /api/currency/supported` - Get supported currencies

### Export/Import (`/api/export`)
- `GET /api/export/csv` - Export transactions as CSV
- `GET /api/export/pdf` - Export transactions as PDF
- `POST /api/export/import` - Import transactions from CSV

### Tags (`/api/tags`)
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag
- `PATCH /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### User (`/api/protected/user`)
- `PATCH /api/protected/user/profile` - Update profile
- `PATCH /api/protected/user/password` - Change password
- `PATCH /api/protected/user/currency` - Update currency preference

All protected routes require a Bearer token:
```
Authorization: Bearer <your-access-token>
```

## 📝 Available Scripts

### Root Level
- `npm run dev` - Run both backend and frontend concurrently
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run install-all` - Install dependencies for all projects

### Backend (`backend/`)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend (`frontend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Key Features Explained

### Currency Conversion
- Users can set their preferred currency in Profile settings
- All amounts are displayed in the user's selected currency
- Real-time exchange rates fetched from external API
- Currency converter tool for quick conversions
- Exchange rates cached for 1 hour to reduce API calls

### Recurring Transactions
- Automatically creates transactions based on frequency
- Scheduler runs daily at midnight
- Supports daily, weekly, monthly, yearly frequencies
- Tracks next recurring date

### Budget Alerts
- Visual indicators when approaching budget limit
- Configurable alert threshold (default 80%)
- Over-budget warnings
- Budget status tracking

### Search & Filter
- Full-text search across title, category, and notes
- Filter by type (income/expense), category, date range
- Real-time search with debouncing
- Combined with pagination

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - Input sanitization
- **Winston** - Logging
- **node-cron** - Task scheduling
- **pdfkit** - PDF generation
- **csv-writer** - CSV export

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts
- **react-hot-toast** - Notifications
- **react-icons** - Icons

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Helmet security headers
- Input sanitization (NoSQL injection protection)
- Request size limits (10MB)
- CORS configuration
- Strong password policies

## 📊 Performance Optimizations

- MongoDB aggregation pipelines for efficient queries
- Indexed database queries
- Exchange rate caching (1 hour)
- Pagination to limit data transfer
- Optimized N+1 query prevention
- Server-side filtering and search

## 🧪 Testing

Test files are located in `backend/tests/`. Run tests with:
```bash
cd backend
npm test
```

## 📄 License

ISC

## 🤝 Contributing

Found a bug or want to add a feature? Feel free to open an issue or submit a pull request!

## 📚 Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Detailed feature documentation
- [High Priority Features](./HIGH_PRIORITY_FEATURES.md) - Recently added features
- [Future Enhancements](./FUTURE.md) - Planned features

---

**Built with ❤️ using the MERN Stack**
