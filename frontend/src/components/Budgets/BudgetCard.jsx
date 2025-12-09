import { memo } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const BudgetCard = memo(({ budget, index, formatCurrency, formatDate, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300 ${
        budget.shouldAlert ? 'ring-2 ring-yellow-500' : ''
      } ${budget.isOverBudget ? 'ring-2 ring-danger' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {budget.category}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {budget.period === 'monthly' ? 'Monthly' : 'Yearly'} Budget
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            budget.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {budget.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Budget</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(budget.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Spent</span>
            <span
              className={`font-semibold ${
                budget.isOverBudget
                  ? 'text-danger'
                  : budget.shouldAlert
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {formatCurrency(budget.spent || 0)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Remaining</span>
            <span
              className={`font-semibold ${
                budget.remaining < 0
                  ? 'text-danger'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {formatCurrency(budget.remaining || 0)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              budget.isOverBudget
                ? 'bg-danger'
                : budget.shouldAlert
                ? 'bg-yellow-500'
                : 'bg-primary'
            }`}
            style={{
              width: `${Math.min(budget.percentageUsed || 0, 100)}%`,
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {budget.percentageUsed?.toFixed(1) || 0}% used
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p>Period: {formatDate(budget.startDate)} - {formatDate(budget.endDate)}</p>
          <p>Alert at: {budget.alertThreshold}%</p>
        </div>

        {budget.shouldAlert && !budget.isOverBudget && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Approaching budget limit
          </div>
        )}

        {budget.isOverBudget && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-danger">
            ⚠️ Budget exceeded!
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(budget)}
          className="flex-1 px-3 py-2 text-sm text-primary hover:text-primary-700 dark:text-accent dark:hover:text-primary-400 border border-primary rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(budget._id)}
          className="flex-1 px-3 py-2 text-sm text-danger hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 border border-danger rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
          aria-label={`Delete budget for ${budget.category}`}
        >
          Delete
        </button>
      </div>
    </motion.div>
  )
}

BudgetCard.propTypes = {
  budget: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    spent: PropTypes.number,
    remaining: PropTypes.number,
    percentageUsed: PropTypes.number,
    period: PropTypes.oneOf(['monthly', 'yearly']).isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    alertThreshold: PropTypes.number,
    isActive: PropTypes.bool,
    shouldAlert: PropTypes.bool,
    isOverBudget: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

BudgetCard.displayName = 'BudgetCard'

export default BudgetCard

