import { useState, useEffect } from 'react'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FiPlus } from 'react-icons/fi'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'
import Dropdown from '../components/Dropdown'
import GoalCard from '../components/Goals/GoalCard'
import GoalForm from '../components/Goals/GoalForm'
import { useCurrency } from '../hooks/useCurrency'
import logger from '../utils/logger'
import { GOAL_FILTER_OPTIONS } from '../utils/constants'

const Goals = () => {
  const { formatCurrency } = useCurrency()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, goalId: null })
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    category: 'Savings',
  })

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'completed') params.append('isCompleted', 'true')
      else if (filter === 'active') params.append('isCompleted', 'false')

      const response = await axios.get(`/api/goals?${params.toString()}`)
      setGoals(response.data.data || [])
    } catch (error) {
      logger.error('Error fetching goals:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [filter])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
      }

      if (editingGoal) {
        await axios.patch(`/api/goals/${editingGoal._id}`, payload)
        toast.success('Goal updated successfully')
      } else {
        await axios.post('/api/goals', payload)
        toast.success('Goal created successfully')
      }

      setIsModalOpen(false)
      setEditingGoal(null)
      resetForm()
      fetchGoals()
    } catch (error) {
      logger.error('Error saving goal:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save goal'
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
    setDeleteConfirm({ isOpen: true, goalId: id })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.goalId) return

    setLoading(true)
    try {
      await axios.delete(`/api/goals/${deleteConfirm.goalId}`)
      toast.success('Goal deleted successfully')
      setDeleteConfirm({ isOpen: false, goalId: null })
      fetchGoals()
    } catch (error) {
      logger.error('Error deleting goal:', error)
      toast.error(error.response?.data?.message || 'Failed to delete goal')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      category: goal.category || 'Savings',
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: 'Savings',
    })
    setEditingGoal(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const daysRemaining = (targetDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diff = target - today
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
            Goals & Targets
          </h1>
          <div className="flex gap-2">
            <Dropdown
              value={filter}
              onChange={setFilter}
              options={GOAL_FILTER_OPTIONS}
              className="w-40"
            />
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
              Add Goal
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && goals.length === 0 ? (
            <div className="col-span-full py-8">
              <LoadingSpinner size="lg" text="Loading goals..." />
            </div>
          ) : goals.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No goals found. Create your first goal!</p>
            </div>
          ) : (
            goals.map((goal, index) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                index={index}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                daysRemaining={daysRemaining}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>

        <GoalForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            resetForm()
          }}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          editingGoal={editingGoal}
          loading={loading}
          resetForm={resetForm}
        />

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, goalId: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Goal"
          message="Are you sure you want to delete this goal? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </PageTransition>
  )
}

export default Goals

