import { useState, useEffect } from 'react'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FiPlus } from 'react-icons/fi'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'
import BudgetCard from '../components/Budgets/BudgetCard'
import BudgetForm from '../components/Budgets/BudgetForm'
import { useCurrency } from '../hooks/useCurrency'
import logger from '../utils/logger'
import { TRANSACTION_CATEGORIES, DEFAULT_ALERT_THRESHOLD } from '../utils/constants'

const Budgets = () => {
  const { formatCurrency } = useCurrency()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, budgetId: null })
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    alertThreshold: 80,
    isActive: true,
  })

  const categories = TRANSACTION_CATEGORIES

  useEffect(() => {
    if (formData.period === 'monthly' && formData.startDate) {
      const start = new Date(formData.startDate)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      end.setDate(end.getDate() - 1)
      setFormData((prev) => ({ ...prev, endDate: end.toISOString().split('T')[0] }))
    } else if (formData.period === 'yearly' && formData.startDate) {
      const start = new Date(formData.startDate)
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 1)
      end.setDate(end.getDate() - 1)
      setFormData((prev) => ({ ...prev, endDate: end.toISOString().split('T')[0] }))
    }
  }, [formData.period, formData.startDate])

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/budgets')
      setBudgets(response.data.data || [])
    } catch (error) {
      logger.error('Error fetching budgets:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch budgets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold),
      }

      if (editingBudget) {
        await axios.patch(`/api/budgets/${editingBudget._id}`, payload)
        toast.success('Budget updated successfully')
      } else {
        await axios.post('/api/budgets', payload)
        toast.success('Budget created successfully')
      }

      setIsModalOpen(false)
      setEditingBudget(null)
      resetForm()
      fetchBudgets()
    } catch (error) {
      logger.error('Error saving budget:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save budget'
      const errors = error.response?.data?.errors
      if (errors && Array.isArray(errors)) {
        errors.forEach((err) => {
          toast.error(err.message || errorMessage)
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, budgetId: id })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.budgetId) return

    setLoading(true)
    try {
      await axios.delete(`/api/budgets/${deleteConfirm.budgetId}`)
      toast.success('Budget deleted successfully')
      setDeleteConfirm({ isOpen: false, budgetId: null })
      fetchBudgets()
    } catch (error) {
      logger.error('Error deleting budget:', error)
      toast.error(error.response?.data?.message || 'Failed to delete budget')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      startDate: new Date(budget.startDate).toISOString().split('T')[0],
      endDate: new Date(budget.endDate).toISOString().split('T')[0],
      alertThreshold: budget.alertThreshold || DEFAULT_ALERT_THRESHOLD,
      isActive: budget.isActive !== undefined ? budget.isActive : true,
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      alertThreshold: DEFAULT_ALERT_THRESHOLD,
      isActive: true,
    })
    setEditingBudget(null)
  }

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
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Budget Management
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-4 h-4" />
            Add Budget
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && budgets.length === 0 ? (
            <div className="col-span-full py-8">
              <LoadingSpinner size="lg" text="Loading budgets..." />
            </div>
          ) : budgets.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No budgets found. Create your first budget!</p>
            </div>
          ) : (
            budgets.map((budget, index) => (
              <BudgetCard
                key={budget._id}
                budget={budget}
                index={index}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>

        <BudgetForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            resetForm()
          }}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          editingBudget={editingBudget}
          categories={categories}
          loading={loading}
          resetForm={resetForm}
        />

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, budgetId: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Budget"
          message="Are you sure you want to delete this budget? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </PageTransition>
  )
}

export default Budgets

