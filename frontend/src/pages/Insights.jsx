import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  FiBarChart2,
  FiTarget,
  FiPieChart,
  FiDollarSign,
  FiTrendingUp as FiUp,
  FiTrendingDown as FiDown,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi'
import PageTransition from '../components/PageTransition'
import LoadingSpinner from '../components/LoadingSpinner'
import QuickStats from '../components/Insights/QuickStats'
import BudgetOverview from '../components/Insights/BudgetOverview'
import GoalsOverview from '../components/Insights/GoalsOverview'
import { useCurrency } from '../hooks/useCurrency'
import logger from '../utils/logger'

const Insights = () => {
  const { user } = useSelector((state) => state.auth)
  const { formatCurrency } = useCurrency()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [predictions, setPredictions] = useState(null)
  const [insights, setInsights] = useState([])

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const [statsRes, budgetsRes, goalsRes, predictionsRes] = await Promise.all([
        axios.get('/api/transactions/stats'),
        axios.get('/api/budgets'),
        axios.get('/api/goals'),
        axios.get('/api/analytics/predictions').catch(() => null),
      ])
      setStats(statsRes.data.data)
      setBudgets((budgetsRes.data.data || []).filter(b => !b.isOverBudget || b.shouldAlert).slice(0, 3))
      setGoals((goalsRes.data.data || []).filter(g => {
        const progress = (g.currentAmount / g.targetAmount) * 100
        return progress < 100
      }).slice(0, 3))
      
      if (predictionsRes?.data?.data) {
        setPredictions(predictionsRes.data.data.predictions)
        setInsights(predictionsRes.data.data.insights || [])
      }
    } catch (error) {
      logger.error('Error fetching insights:', error)
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <LoadingSpinner size="xl" text="Loading insights..." />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 truncate">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your financial overview
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          <QuickStats stats={stats} formatCurrency={formatCurrency} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BudgetOverview budgets={budgets} formatCurrency={formatCurrency} />
          <GoalsOverview goals={goals} formatCurrency={formatCurrency} />
        </div>

        {predictions?.nextMonth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl shadow-lg p-6 mb-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiBarChart2 className="w-6 h-6" />
                Spending Predictions
              </h2>
              {predictions.nextMonth.trend === 'increasing' ? (
                <FiUp className="w-5 h-5 text-yellow-300" />
              ) : predictions.nextMonth.trend === 'decreasing' ? (
                <FiDown className="w-5 h-5 text-green-300" />
              ) : (
                <FiInfo className="w-5 h-5 text-blue-300" />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-indigo-100 text-sm mb-1">Predicted Next Month</p>
                <p className="text-2xl sm:text-3xl font-bold mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatCurrency(predictions.nextMonth.amount)}
                </p>
                <p className="text-indigo-100 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                  {predictions.nextMonth.trend === 'increasing' && '+'}
                  {predictions.nextMonth.trendPercentage}% trend • {predictions.nextMonth.confidence} confidence
                </p>
              </div>
              {predictions.nextQuarter && (
                <div>
                  <p className="text-indigo-100 text-sm mb-1">Predicted Next Quarter</p>
                  <p className="text-2xl sm:text-3xl font-bold mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatCurrency(predictions.nextQuarter.amount)}
                  </p>
                  <p className="text-indigo-100 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                    Based on {predictions.nextMonth.basedOn}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-6 space-y-3"
          >
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                    : insight.type === 'positive'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.icon === 'trending-up' && <FiUp className="w-5 h-5 mt-0.5" />}
                  {insight.icon === 'trending-down' && <FiDown className="w-5 h-5 mt-0.5" />}
                  {insight.icon === 'alert' && <FiAlertCircle className="w-5 h-5 mt-0.5" />}
                  {insight.icon === 'info' && <FiInfo className="w-5 h-5 mt-0.5" />}
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {insight.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center break-words">
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
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center break-words">
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
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center break-words">
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
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center break-words">
                View Reports
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default Insights

