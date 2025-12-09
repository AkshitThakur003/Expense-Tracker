import PropTypes from 'prop-types'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Dropdown from '../Dropdown'
import { STORAGE_KEYS } from '../../utils/constants'

const ExpenseFilters = ({ 
  filters, 
  setFilters, 
  sortBy, 
  setSortBy, 
  categories,
  savedFilters,
  setSavedFilters
}) => {
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)

  const saveCurrentFilter = () => {
    const filterName = prompt('Enter a name for this filter:')
    if (filterName) {
      const newFilter = {
        id: Date.now(),
        name: filterName,
        filters: { ...filters },
        sortBy,
      }
      const updated = [...savedFilters, newFilter]
      setSavedFilters(updated)
      localStorage.setItem(STORAGE_KEYS.SAVED_FILTERS, JSON.stringify(updated))
      toast.success('Filter saved successfully')
    }
  }

  const loadSavedFilter = (savedFilter) => {
    setFilters(savedFilter.filters)
    setSortBy(savedFilter.sortBy)
    toast.success(`Loaded filter: ${savedFilter.name}`)
  }

  const deleteSavedFilter = (filterId) => {
    const updated = savedFilters.filter((f) => f.id !== filterId)
    setSavedFilters(updated)
    localStorage.setItem('savedFilters', JSON.stringify(updated))
    toast.success('Filter deleted')
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters & Sort
        </h2>
        <div className="flex gap-2">
          {savedFilters.length > 0 && (
            <div className="relative group">
              <button
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                aria-label={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
              >
                Saved Filters
                {filtersCollapsed ? <FiChevronDown /> : <FiChevronUp />}
              </button>
              {!filtersCollapsed && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {savedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <button
                          onClick={() => loadSavedFilter(filter)}
                          className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
                        >
                          {filter.name}
                        </button>
                        <button
                          onClick={() => deleteSavedFilter(filter.id)}
                          className="text-danger hover:text-danger-700 text-sm"
                          aria-label={`Delete filter ${filter.name}`}
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={saveCurrentFilter}
            className="px-3 py-1 text-sm text-primary hover:text-primary-700 dark:text-accent"
          >
            Save Filter
          </button>
          <button
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            aria-label={filtersCollapsed ? 'Expand filters' : 'Collapse filters'}
          >
            <FiFilter />
            {filtersCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {!filtersCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Dropdown
                label="Type"
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value })}
                options={[
                  { value: '', label: 'All' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ]}
                placeholder="All"
              />
              <Dropdown
                label="Category"
                value={filters.category}
                onChange={(value) => setFilters({ ...filters, category: value })}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
                placeholder="All Categories"
                searchable
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Dropdown
                label="Sort By"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: '-date', label: 'Date (Newest)' },
                  { value: 'date', label: 'Date (Oldest)' },
                  { value: '-amount', label: 'Amount (High to Low)' },
                  { value: 'amount', label: 'Amount (Low to High)' },
                  { value: 'title', label: 'Title (A-Z)' },
                ]}
                placeholder="Sort By"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilters({ type: '', category: '', startDate: '', endDate: '' })
                  setSortBy('-date')
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

ExpenseFilters.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.string,
    category: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  setFilters: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  savedFilters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      filters: PropTypes.object.isRequired,
      sortBy: PropTypes.string.isRequired,
    })
  ).isRequired,
  setSavedFilters: PropTypes.func.isRequired,
}

export default ExpenseFilters

