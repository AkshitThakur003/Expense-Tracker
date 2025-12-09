import { memo } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const GoalCard = memo(({ goal, index, formatCurrency, formatDate, daysRemaining, onEdit, onDelete }) => {
  const days = daysRemaining(goal.targetDate)
  const isOverdue = days < 0 && !goal.isCompleted
  const progress = goal.progressPercentage || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow duration-300 ${
        goal.isCompleted ? 'ring-2 ring-green-500' : isOverdue ? 'ring-2 ring-danger' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {goal.description}
            </p>
          )}
        </div>
        {goal.isCompleted && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Completed
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Target</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Current</span>
            <span className="font-semibold text-primary">
              {formatCurrency(goal.currentAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Remaining</span>
            <span
              className={`font-semibold ${
                goal.targetAmount - goal.currentAmount <= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              goal.isCompleted
                ? 'bg-green-500'
                : progress >= 75
                ? 'bg-primary'
                : progress >= 50
                ? 'bg-yellow-500'
                : 'bg-danger'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {progress.toFixed(1)}% complete
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p>Category: {goal.category}</p>
          <p>
            Target Date: {formatDate(goal.targetDate)}
            {!goal.isCompleted && (
              <span className={`ml-2 ${isOverdue ? 'text-danger' : 'text-gray-500'}`}>
                ({isOverdue ? `${Math.abs(days)} days overdue` : `${days} days left`})
              </span>
            )}
          </p>
        </div>

        {isOverdue && !goal.isCompleted && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-danger">
            ⚠️ Target date has passed
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(goal)}
          className="flex-1 px-3 py-2 text-sm text-primary hover:text-primary-700 dark:text-accent dark:hover:text-primary-400 border border-primary rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(goal._id)}
          className="flex-1 px-3 py-2 text-sm text-danger hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 border border-danger rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
          aria-label={`Delete goal ${goal.title}`}
        >
          Delete
        </button>
      </div>
    </motion.div>
  )
}

GoalCard.propTypes = {
  goal: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    targetAmount: PropTypes.number.isRequired,
    currentAmount: PropTypes.number.isRequired,
    targetDate: PropTypes.string.isRequired,
    category: PropTypes.string,
    progressPercentage: PropTypes.number,
    isCompleted: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  daysRemaining: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

GoalCard.displayName = 'GoalCard'

export default GoalCard

