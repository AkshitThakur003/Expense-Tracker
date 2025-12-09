import PropTypes from 'prop-types'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiTarget, FiArrowRight } from 'react-icons/fi'

const GoalsOverview = memo(({ goals, formatCurrency }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
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
            Create Goal
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const isCompleted = goal.currentAmount >= goal.targetAmount
            
            return (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex justify-between items-center mb-2 gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                    {goal.name}
                  </span>
                  {isCompleted && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full flex-shrink-0">
                      ✓ Completed
                    </span>
                  )}
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
  )
}

export default GoalsOverview

