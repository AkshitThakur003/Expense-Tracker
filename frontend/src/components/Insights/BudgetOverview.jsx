import PropTypes from 'prop-types'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiPieChart, FiArrowRight, FiAlertCircle } from 'react-icons/fi'

const BudgetOverview = memo(({ budgets, formatCurrency }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiPieChart className="w-5 h-5 text-primary" />
          Budget Status
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">No active budgets</p>
          <Link
            to="/budgets"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
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
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
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
  )
}

export default BudgetOverview

