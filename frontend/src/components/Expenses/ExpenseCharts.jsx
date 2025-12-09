import PropTypes from 'prop-types'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import { CHART_COLORS } from '../../utils/constants'

const ExpenseCharts = ({ stats, statsLoading, formatCurrency }) => {
  const pieChartData = useMemo(() => 
    stats?.topCategories?.map((item, index) => ({
      name: item.category,
      value: item.amount,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })) || []
  , [stats?.topCategories])

  const barChartData = useMemo(() => 
    stats?.monthlyExpenseData || []
  , [stats?.monthlyExpenseData])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* Pie Chart - Categories */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Expenses by Category
        </h2>
        {statsLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ) : pieChartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const total = pieChartData.reduce((sum, item) => sum + item.value, 0)
                    const percent = ((value / total) * 100).toFixed(1)
                    return [
                      `${formatCurrency(value)} (${percent}%)`,
                      name
                    ]
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend with Values */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(() => {
                const total = pieChartData.reduce((sum, item) => sum + item.value, 0)
                return pieChartData.map((item, index) => {
                  const percent = ((item.value / total) * 100).toFixed(1)
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            No expense data available
          </div>
        )}
      </div>

      {/* Bar Chart - Monthly Expenses */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Monthly Expenses
        </h2>
        {statsLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ) : barChartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart 
                data={barChartData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '10px' }}
                  tick={{ fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#DC2626" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Monthly Summary List */}
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              {barChartData.map((item, index) => {
                const prevItem = index > 0 ? barChartData[index - 1] : null
                const change = prevItem ? item.amount - prevItem.amount : null
                const changePercent = prevItem && prevItem.amount > 0 
                  ? ((change / prevItem.amount) * 100).toFixed(1) 
                  : null
                const isIncrease = change && change > 0
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {item.month}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      {change !== null && (
                        <span className={`text-xs font-medium ${
                          isIncrease 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {isIncrease ? '↑' : '↓'} {changePercent}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            No monthly expense data available
          </div>
        )}
      </div>
    </div>
  )
}

ExpenseCharts.propTypes = {
  stats: PropTypes.shape({
    topCategories: PropTypes.arrayOf(
      PropTypes.shape({
        category: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
      })
    ),
    monthlyExpenseData: PropTypes.arrayOf(
      PropTypes.shape({
        month: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
      })
    ),
  }),
  statsLoading: PropTypes.bool.isRequired,
  formatCurrency: PropTypes.func.isRequired,
}

export default ExpenseCharts

