import { useState, useEffect } from 'react'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import LoadingSpinner from '../components/LoadingSpinner'
import Dropdown from '../components/Dropdown'
import { useCurrency } from '../hooks/useCurrency'
import logger from '../utils/logger'
import { REPORT_PERIOD_OPTIONS } from '../utils/constants'

const Reports = () => {
  const { formatCurrency } = useCurrency()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('all') // Default to 'all' to show all transactions
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Fetch report
  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await axios.get(`/api/reports/${period}?${params.toString()}`)
      setReport(response.data.data)
    } catch (error) {
      logger.error('Error fetching report:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [period])


  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <PageTransition>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
        <div className="flex gap-2 flex-wrap">
            <Dropdown
              value={period}
              onChange={setPeriod}
              options={REPORT_PERIOD_OPTIONS}
              className="w-40"
            />
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Generate Report
          </button>
        </div>
        </motion.div>

      {loading ? (
        <div className="py-12">
          <LoadingSpinner size="lg" text="Generating report..." />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Total Income
              </h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(report.summary.totalIncome)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Total Expense
              </h3>
              <p className="text-2xl font-bold text-danger dark:text-danger-400">
                {formatCurrency(report.summary.totalExpense)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Balance
              </h3>
              <p
                className={`text-2xl font-bold ${
                  report.summary.balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-danger dark:text-danger-400'
                }`}
              >
                {formatCurrency(report.summary.balance)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Transactions
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {report.summary.transactionCount}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Breakdown Line Chart */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Breakdown
              </h2>
              {report.dailyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={2} name="Expense" />
                    <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </div>

            {/* Category Breakdown Bar Chart */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Category Breakdown
              </h2>
              {report.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.categoryBreakdown.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#DC2626" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Budget Status */}
          {report.budgetStatus && report.budgetStatus.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Budget Status
              </h2>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {report.budgetStatus.map((budget, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-2 ${
                      budget.isOverBudget
                        ? 'border-danger'
                        : budget.percentage >= 80
                        ? 'border-yellow-500'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {budget.category}
                      </h3>
                      {budget.isOverBudget && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-danger text-white">
                          Over Budget
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Budget</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(budget.budget)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Spent</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(budget.spent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Remaining</span>
                        <span
                          className={`text-sm font-semibold ${
                            budget.remaining < 0
                              ? 'text-danger'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {formatCurrency(budget.remaining)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                        <span>Progress</span>
                        <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            budget.isOverBudget
                              ? 'bg-danger'
                              : budget.percentage >= 80
                              ? 'bg-yellow-500'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {report.budgetStatus.map((budget, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {budget.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(budget.budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(budget.spent)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                            budget.remaining < 0
                              ? 'text-danger'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {formatCurrency(budget.remaining)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  budget.isOverBudget
                                    ? 'bg-danger'
                                    : budget.percentage >= 80
                                    ? 'bg-yellow-500'
                                    : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {budget.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Expenses */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Expenses
              </h2>
              {report.topExpenses.length > 0 ? (
                <div className="space-y-2">
                  {report.topExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.category} • {formatDate(expense.date)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-danger">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No expenses found</p>
              )}
            </div>

            {/* Top Incomes */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Incomes
              </h2>
              {report.topIncomes.length > 0 ? (
                <div className="space-y-2">
                  {report.topIncomes.map((income) => (
                    <div
                      key={income.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {income.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {income.category} • {formatDate(income.date)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(income.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No incomes found</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No report data available</p>
        </div>
      )}
      </div>
    </PageTransition>
  )
}

export default Reports

