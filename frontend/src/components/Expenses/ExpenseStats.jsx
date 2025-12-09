import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import SkeletonLoader from '../SkeletonLoader'

const ExpenseStats = ({ stats, statsLoading, formatCurrency }) => {
  if (statsLoading) {
    return <SkeletonLoader count={3} className="grid grid-cols-1 md:grid-cols-3 gap-6" />
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-300"
      >
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Total Income
        </h3>
        <p className="text-xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(stats?.totalIncome || 0)}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-300"
      >
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Total Expense
        </h3>
        <p className="text-xl font-bold text-danger dark:text-danger-400">
          {formatCurrency(stats?.totalExpense || 0)}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-300"
      >
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Balance
        </h3>
        <p
          className={`text-xl font-bold ${
            (stats?.balance || 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-danger dark:text-danger-400'
          }`}
        >
          {formatCurrency(stats?.balance || 0)}
        </p>
      </motion.div>
    </>
  )
}

ExpenseStats.propTypes = {
  stats: PropTypes.shape({
    totalIncome: PropTypes.number,
    totalExpense: PropTypes.number,
    balance: PropTypes.number,
  }),
  statsLoading: PropTypes.bool.isRequired,
  formatCurrency: PropTypes.func.isRequired,
}

export default ExpenseStats

