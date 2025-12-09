import PropTypes from 'prop-types'
import { FiCheckSquare, FiSquare, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi'
import TransactionCard from '../TransactionCard'
import LoadingSpinner from '../LoadingSpinner'

const ExpenseTable = ({
  transactions,
  loading,
  selectedTransactions,
  handleSelectAll,
  handleSelectTransaction,
  handleEdit,
  handleDeleteClick,
  formatCurrency,
  formatDate,
  onAddTransaction,
}) => {
  if (loading && transactions.length === 0) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Loading transactions..." />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">
          <FiDollarSign className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" />
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Start tracking your expenses by adding your first transaction</p>
        <button
          onClick={onAddTransaction}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center gap-2 mx-auto"
        >
          <FiDollarSign className="w-4 h-4" />
          Add Transaction
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden p-4 space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction._id} className="relative">
            <button
              onClick={() => handleSelectTransaction(transaction._id)}
              className="absolute top-2 right-2 z-10"
              aria-label={`Select transaction ${transaction.title}`}
            >
              {selectedTransactions.includes(transaction._id) ? (
                <FiCheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <FiSquare className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <TransactionCard
              transaction={transaction}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-hidden">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '35px' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center"
                  aria-label="Select all transactions"
                >
                  {selectedTransactions.length === transactions.length ? (
                    <FiCheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <FiSquare className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Title
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Recurring
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr
                key={transaction._id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedTransactions.includes(transaction._id)
                    ? 'bg-primary/5 dark:bg-primary/10'
                    : ''
                }`}
              >
                <td className="px-2 py-2">
                  <button
                    onClick={() => handleSelectTransaction(transaction._id)}
                    aria-label={`Select transaction ${transaction.title}`}
                    className="flex items-center"
                  >
                    {selectedTransactions.includes(transaction._id) ? (
                      <FiCheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <FiSquare className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-2 min-w-0">
                  <div 
                    className="text-xs font-medium text-gray-900 dark:text-white truncate block max-w-full" 
                    title={`${transaction.title}${transaction.note ? ` - ${transaction.note}` : ''}`}
                    style={{ 
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {transaction.title}
                  </div>
                  {transaction.note && (
                    <div 
                      className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate block max-w-full" 
                      title={transaction.note}
                      style={{ 
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {transaction.note}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs font-semibold ${
                      transaction.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-danger dark:text-danger-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td className="px-3 py-2 min-w-0">
                  <div 
                    className="text-xs text-gray-500 dark:text-gray-400 truncate block max-w-full" 
                    title={transaction.category}
                    style={{ 
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {transaction.category}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.date)}
                  </div>
                </td>
                <td className="px-2 py-2">
                  {transaction.recurring ? (
                    <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Yes
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-primary hover:text-primary-700 dark:text-accent dark:hover:text-primary-400 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(transaction._id)}
                      className="text-danger hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 text-xs"
                      aria-label={`Delete transaction ${transaction.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

ExpenseTable.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      type: PropTypes.oneOf(['income', 'expense']).isRequired,
      category: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      recurring: PropTypes.bool,
      note: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  selectedTransactions: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleSelectTransaction: PropTypes.func.isRequired,
  handleEdit: PropTypes.func.isRequired,
  handleDeleteClick: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  onAddTransaction: PropTypes.func.isRequired,
}

export default ExpenseTable

