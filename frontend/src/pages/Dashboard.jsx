import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiPieChart,
  FiBarChart2,
  FiTarget,
  FiArrowRight,
  FiPlus,
  FiAlertCircle
} from 'react-icons/fi'
import PageTransition from '../components/PageTransition'
import LoadingSpinner from '../components/LoadingSpinner'
import { useCurrency } from '../hooks/useCurrency'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const { formatCurrency } = useCurrency()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, budgetsRes, goalsRes] = await Promise.all([
        axios.get('/api/transactions/stats'),
        axios.get('/api/budgets'),
        axios.get('/api/goals'),
      ])
      setStats(statsRes.data.data)
      setBudgets((budgetsRes.data.data || []).filter(b => b.isActive && (b.isOverBudget || b.shouldAlert)).slice(0, 3))
      setGoals((goalsRes.data.data || []).filter(g => {
        const progress = (g.currentAmount / g.targetAmount) * 100
        return progress < 100
      }).slice(0, 3))
    } catch (error) {
      logger.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <LoadingSpinner size="xl" text="Loading dashboard..." />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 truncate">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 truncate">
            Welcome back, {user?.name || 'User'}! Here's your financial overview.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link
              to="/expenses"
              className="block bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-w-0"
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <FiTrendingUp className="w-8 h-8 flex-shrink-0" />
                <span className="text-green-100 text-sm truncate">Income</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold mb-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                {formatCurrency(stats?.totalIncome || 0)}
              </p>
              <p className="text-green-100 text-sm truncate">Total income</p>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/expenses"
              className="block bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-w-0"
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <FiTrendingDown className="w-8 h-8 flex-shrink-0" />
                <span className="text-red-100 text-sm truncate">Expense</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold mb-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                {formatCurrency(stats?.totalExpense || 0)}
              </p>
              <p className="text-red-100 text-sm truncate">Total expense</p>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className={`block rounded-xl p-6 shadow-lg min-w-0 ${
                (stats?.balance || 0) >= 0
                  ? 'bg-gradient-to-br from-primary to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white'
                  : 'bg-gradient-to-br from-danger to-danger-600 dark:from-danger-600 dark:to-danger-700 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <FiDollarSign className="w-8 h-8 flex-shrink-0" />
                <span className="text-white/80 text-sm truncate">Balance</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold mb-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                {formatCurrency(stats?.balance || 0)}
              </p>
              <p className="text-white/80 text-sm truncate">Current balance</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/reports"
              className="block bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-w-0"
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <FiBarChart2 className="w-8 h-8 flex-shrink-0" />
                <span className="text-indigo-100 text-sm truncate">Categories</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold mb-1">
                {stats?.topCategories?.length || 0}
              </p>
              <p className="text-indigo-100 text-sm truncate">Active categories</p>
            </Link>
          </motion.div>
        </div>

        {/* Budgets & Goals Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budgets Alert */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiPieChart className="w-5 h-5 text-primary" />
                Budget Alerts
              </h2>
              <Link
                to="/budgets"
                className="text-primary hover:text-primary-700 dark:text-accent text-sm font-medium flex items-center gap-1"
              >
                View All
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {budgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No budget alerts</p>
                <Link
                  to="/budgets"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create Budget
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget, index) => (
                  <motion.div
                    key={budget._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className={`p-4 rounded-lg border-2 ${
                      budget.isOverBudget
                        ? 'border-danger bg-red-50 dark:bg-red-900/20'
                        : budget.shouldAlert
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                        {budget.category}
                      </span>
                      {budget.isOverBudget && (
                        <FiAlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                      )}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          budget.isOverBudget
                            ? 'bg-danger'
                            : budget.shouldAlert
                            ? 'bg-yellow-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(budget.percentageUsed || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {budget.percentageUsed?.toFixed(1) || 0}% used
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis text-right">
                        {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Goals Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiTarget className="w-5 h-5 text-primary" />
                Active Goals
              </h2>
              <Link
                to="/goals"
                className="text-primary hover:text-primary-700 dark:text-accent text-sm font-medium flex items-center gap-1"
              >
                View All
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No active goals</p>
                <Link
                  to="/goals"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create Goal
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal, index) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  
                  return (
                    <motion.div
                      key={goal._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex justify-between items-center mb-2 gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                          {goal.title}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                        <div
                          className="h-2 rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {progress.toFixed(1)}% complete
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis text-right">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/expenses"
              className="flex flex-col items-center justify-center p-4 bg-primary/10 dark:bg-primary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Add Transaction
              </span>
            </Link>
            <Link
              to="/budgets"
              className="flex flex-col items-center justify-center p-4 bg-green-500/10 dark:bg-green-500/20 rounded-lg hover:bg-green-500/20 dark:hover:bg-green-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <FiPieChart className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Set Budget
              </span>
            </Link>
            <Link
              to="/goals"
              className="flex flex-col items-center justify-center p-4 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-2">
                <FiTarget className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Create Goal
              </span>
            </Link>
            <Link
              to="/reports"
              className="flex flex-col items-center justify-center p-4 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                <FiBarChart2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                View Reports
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default Dashboard
