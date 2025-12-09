import PropTypes from 'prop-types'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2 } from 'react-icons/fi'

const QuickStats = memo(({ stats, formatCurrency }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <>
      <motion.div variants={itemVariants}>
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

      <motion.div variants={itemVariants}>
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

      <motion.div variants={itemVariants}>
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

      <motion.div variants={itemVariants}>
        <Link
          to="/reports"
          className="block bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-w-0"
        >
          <div className="flex items-center justify-between mb-4 gap-2">
            <FiBarChart2 className="w-8 h-8 flex-shrink-0" />
            <span className="text-indigo-100 text-sm truncate">Reports</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-1">
            {stats?.topCategories?.length || 0}
          </p>
          <p className="text-indigo-100 text-sm truncate">Active categories</p>
        </Link>
      </motion.div>
    </>
  )
}

export default QuickStats

