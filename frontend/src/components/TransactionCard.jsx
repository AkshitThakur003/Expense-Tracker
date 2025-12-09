import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const TransactionCard = ({ transaction, onEdit, onDelete, formatCurrency, formatDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {transaction.title}
          </h3>
          {transaction.note && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {transaction.note}
            </p>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
            transaction.type === 'income'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {transaction.type}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
          <span
            className={`text-lg font-bold ${
              transaction.type === 'income'
                ? 'text-green-600 dark:text-green-400'
                : 'text-danger dark:text-danger-400'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {transaction.category}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {formatDate(transaction.date)}
          </span>
        </div>
        {transaction.recurring && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Recurring</span>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Yes
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onEdit(transaction)}
          className="flex-1 px-3 py-2 text-sm text-primary hover:text-primary-700 dark:text-accent dark:hover:text-primary-400 border border-primary rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-center gap-2"
          aria-label={`Edit transaction ${transaction.title}`}
        >
          <FiEdit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(transaction._id)}
          className="flex-1 px-3 py-2 text-sm text-danger hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 border border-danger rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors flex items-center justify-center gap-2"
          aria-label={`Delete transaction ${transaction.title}`}
        >
          <FiTrash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </motion.div>
  )
}

export default TransactionCard

