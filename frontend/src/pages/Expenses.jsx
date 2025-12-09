import { useState, useEffect, useCallback } from 'react'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FiPlus, FiDownload, FiUpload } from 'react-icons/fi'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import ExpenseStats from '../components/Expenses/ExpenseStats'
import ExpenseCharts from '../components/Expenses/ExpenseCharts'
import ExpenseFilters from '../components/Expenses/ExpenseFilters'
import ExpenseForm from '../components/Expenses/ExpenseForm'
import ExpenseTable from '../components/Expenses/ExpenseTable'
import Dropdown from '../components/Dropdown'
import { parseCurrency } from '../utils/currency'
import { useCurrency } from '../hooks/useCurrency'
import { exportCSV, exportPDF, importCSV } from '../utils/csvUtils'
import logger from '../utils/logger'
import { TRANSACTION_CATEGORIES, DEFAULT_PAGE_SIZE, STORAGE_KEYS } from '../utils/constants'

const Expenses = () => {
  const { formatCurrency } = useCurrency()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: parseInt(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_PER_PAGE) || DEFAULT_PAGE_SIZE.toString(), 10),
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, transactionId: null })
  const [selectedTransactions, setSelectedTransactions] = useState([])
  const [savedFilters, setSavedFilters] = useState([])
  const [formErrors, setFormErrors] = useState({})
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
    note: '',
  })

  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  })

  const [sortBy, setSortBy] = useState('-date')

  // Categories list
  const categories = TRANSACTION_CATEGORIES

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (sortBy) params.append('sortBy', sortBy)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await axios.get(`/api/transactions?${params.toString()}`)
      setTransactions(response.data.data || [])
      if (response.data.pagination) {
        setPagination(response.data.pagination)
      }
    } catch (error) {
      logger.error('Error fetching transactions:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, searchQuery, pagination.limit])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await axios.get('/api/transactions/stats')
      setStats(response.data.data)
    } catch (error) {
      logger.error('Error fetching stats:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch statistics')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchTransactions])

  useEffect(() => {
    fetchTransactions(pagination.page)
    fetchStats()
  }, [filters.type, filters.category, filters.startDate, filters.endDate, sortBy, fetchTransactions, fetchStats, pagination.page])

  // Load saved filters
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_FILTERS)
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch (e) {
        logger.error('Error loading saved filters:', e)
      }
    }
  }, [])

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    
    if (name === 'amount' && value) {
      const parsed = parseCurrency(value)
      setFormData((prev) => ({
        ...prev,
        [name]: parsed.toString(),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
    if (!formData.category) {
      errors.category = 'Category is required'
    }
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    setLoading(true)

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      }

      if (editingTransaction) {
        await axios.patch(`/api/transactions/${editingTransaction._id}`, payload)
        toast.success('Transaction updated successfully')
      } else {
        await axios.post('/api/transactions', payload)
        toast.success('Transaction created successfully')
      }

      setIsModalOpen(false)
      setEditingTransaction(null)
      resetForm()
      setFormErrors({})
      fetchTransactions(pagination.page)
      fetchStats()
    } catch (error) {
      logger.error('Error saving transaction:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save transaction'
      const errors = error.response?.data?.errors
      
      if (errors && Array.isArray(errors)) {
        const fieldErrors = {}
        errors.forEach((err) => {
          if (err.field) {
            fieldErrors[err.field] = err.message
          } else {
            toast.error(err.message || errorMessage)
          }
        })
        setFormErrors(fieldErrors)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, transactionId: id, isBulk: false })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.transactionId || deleteConfirm.isBulk) return

    setLoading(true)
    try {
      await axios.delete(`/api/transactions/${deleteConfirm.transactionId}`)
      toast.success('Transaction deleted successfully')
      setDeleteConfirm({ isOpen: false, transactionId: null })
      fetchTransactions(pagination.page)
      fetchStats()
    } catch (error) {
      logger.error('Error deleting transaction:', error)
      toast.error(error.response?.data?.message || 'Failed to delete transaction')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      date: new Date(transaction.date).toISOString().split('T')[0],
      recurring: transaction.recurring || false,
      note: transaction.note || '',
    })
    setIsModalOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      recurring: false,
      note: '',
    })
    setEditingTransaction(null)
    setFormErrors({})
  }

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(transactions.map(t => t._id))
    }
  }

  const handleSelectTransaction = (id) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = () => {
    if (selectedTransactions.length === 0) return
    setDeleteConfirm({
      isOpen: true,
      transactionId: selectedTransactions,
      isBulk: true,
    })
  }

  const handleBulkDeleteConfirm = async () => {
    if (!deleteConfirm.transactionId) return

    setLoading(true)
    try {
      const ids = Array.isArray(deleteConfirm.transactionId)
        ? deleteConfirm.transactionId
        : [deleteConfirm.transactionId]

      await Promise.all(ids.map((id) => axios.delete(`/api/transactions/${id}`)))
      toast.success(`Deleted ${ids.length} transaction(s) successfully`)
      setDeleteConfirm({ isOpen: false, transactionId: null })
      setSelectedTransactions([])
      fetchTransactions(pagination.page)
      fetchStats()
    } catch (error) {
      logger.error('Error deleting transactions:', error)
      toast.error(error.response?.data?.message || 'Failed to delete transactions')
    } finally {
      setLoading(false)
    }
  }

  // Export handlers
  const handleExportCSV = useCallback(() => {
    exportCSV(filters)
  }, [filters])

  const handleExportPDF = useCallback(() => {
    exportPDF(filters)
  }, [filters])

  const handleImportCSV = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    await importCSV(file, () => {
      fetchTransactions(1)
      fetchStats()
      e.target.value = ''
    })
  }, [fetchTransactions, fetchStats])

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchTransactions(newPage, pagination.limit)
  }

  const handlePageSizeChange = (newLimit) => {
    const limit = parseInt(newLimit, 10)
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_PER_PAGE, limit.toString())
    setPagination(prev => ({ ...prev, limit, page: 1 }))
    fetchTransactions(1, limit)
  }

  // Format date
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  return (
    <PageTransition>
      <div className="w-full max-w-full overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Expense Tracker
          </h1>
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 flex items-center gap-2"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportPDF}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 flex items-center gap-2"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </motion.button>
            <motion.label
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <FiUpload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </motion.label>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Add Transaction
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ExpenseStats stats={stats} statsLoading={statsLoading} formatCurrency={formatCurrency} />
        </div>

        {/* Charts */}
        <ExpenseCharts stats={stats} statsLoading={statsLoading} formatCurrency={formatCurrency} />

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Transactions
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, category, or note..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <ExpenseFilters
          filters={filters}
          setFilters={setFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          categories={categories}
          savedFilters={savedFilters}
          setSavedFilters={setSavedFilters}
        />

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <div className="bg-primary/10 dark:bg-primary/20 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {selectedTransactions.length} transaction(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm text-danger hover:text-danger-700 dark:text-danger-400 border border-danger rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedTransactions([])}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <ExpenseTable
            transactions={transactions}
            loading={loading}
            selectedTransactions={selectedTransactions}
            handleSelectAll={handleSelectAll}
            handleSelectTransaction={handleSelectTransaction}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onAddTransaction={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          />
          
          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Per page:
                  </label>
                  <Dropdown
                    value={pagination.limit.toString()}
                    onChange={(value) => handlePageSizeChange(value)}
                    options={[
                      { value: '10', label: '10' },
                      { value: '25', label: '25' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' },
                    ]}
                    className="w-20"
                  />
                </div>
              </div>
              {pagination.pages > 1 && (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        <ExpenseForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            resetForm()
          }}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          editingTransaction={editingTransaction}
          categories={categories}
          formErrors={formErrors}
          loading={loading}
          resetForm={resetForm}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
          onConfirm={deleteConfirm.isBulk ? handleBulkDeleteConfirm : handleDeleteConfirm}
          title={deleteConfirm.isBulk ? 'Delete Transactions' : 'Delete Transaction'}
          message={
            deleteConfirm.isBulk
              ? `Are you sure you want to delete ${Array.isArray(deleteConfirm.transactionId) ? deleteConfirm.transactionId.length : 1} transaction(s)? This action cannot be undone.`
              : 'Are you sure you want to delete this transaction? This action cannot be undone.'
          }
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </PageTransition>
  )
}

export default Expenses

