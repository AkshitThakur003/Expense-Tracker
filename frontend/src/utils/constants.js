/**
 * Application-wide constants
 */

// Transaction Categories
export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
]

// Goal Categories
export const GOAL_CATEGORIES = [
  'Savings',
  'Emergency Fund',
  'Vacation',
  'Education',
  'Home',
  'Vehicle',
  'Investment',
  'Other',
]

// Budget Periods
export const BUDGET_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

// Transaction Types
export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
]

// Pagination Options
export const PAGINATION_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]

// Default Pagination
export const DEFAULT_PAGE_SIZE = 25

// Sort Options
export const SORT_OPTIONS = [
  { value: '-date', label: 'Date (Newest)' },
  { value: 'date', label: 'Date (Oldest)' },
  { value: '-amount', label: 'Amount (High to Low)' },
  { value: 'amount', label: 'Amount (Low to High)' },
  { value: 'title', label: 'Title (A-Z)' },
]

// Supported Currencies
export const SUPPORTED_CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
]

// Chart Colors
export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7',
]

// Default Budget Alert Threshold
export const DEFAULT_ALERT_THRESHOLD = 80

// Goal Filter Options
export const GOAL_FILTER_OPTIONS = [
  { value: 'all', label: 'All Goals' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

// Report Period Options
export const REPORT_PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

// Notification Preferences
export const NOTIFICATION_PREFERENCE_KEYS = {
  BUDGET_ALERTS: 'budgetAlerts',
  GOAL_ACHIEVEMENTS: 'goalAchievements',
  MONTHLY_REPORTS: 'monthlyReports',
  SPENDING_ALERTS: 'spendingAlerts',
}

export const NOTIFICATION_PREFERENCES = [
  {
    key: NOTIFICATION_PREFERENCE_KEYS.BUDGET_ALERTS,
    label: 'Budget Alerts',
    desc: 'Get notified when you approach or exceed your budget',
  },
  {
    key: NOTIFICATION_PREFERENCE_KEYS.GOAL_ACHIEVEMENTS,
    label: 'Goal Achievements',
    desc: 'Celebrate when you reach your financial goals',
  },
  {
    key: NOTIFICATION_PREFERENCE_KEYS.MONTHLY_REPORTS,
    label: 'Monthly Reports',
    desc: 'Receive monthly spending summaries',
  },
  {
    key: NOTIFICATION_PREFERENCE_KEYS.SPENDING_ALERTS,
    label: 'Spending Alerts',
    desc: 'Alerts for unusual spending patterns',
  },
]

// Local Storage Keys
export const STORAGE_KEYS = {
  TRANSACTIONS_PER_PAGE: 'transactionsPerPage',
  SAVED_FILTERS: 'savedFilters',
}

// API Timeouts
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  IMPORT: 60000, // 60 seconds for CSV imports
}

