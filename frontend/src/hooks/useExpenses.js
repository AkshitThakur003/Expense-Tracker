import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import { parseCurrency } from '../utils/currency'
import logger from '../utils/logger'
import { DEFAULT_PAGE_SIZE, STORAGE_KEYS } from '../utils/constants'

export const useExpenses = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: parseInt(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_PER_PAGE) || DEFAULT_PAGE_SIZE.toString(), 10),
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  })
  const [sortBy, setSortBy] = useState('-date')
  const [searchQuery, setSearchQuery] = useState('')

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

  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    fetchTransactions(newPage, pagination.limit)
  }, [fetchTransactions, pagination.limit])

  // Handle page size change
  const handlePageSizeChange = useCallback((newLimit) => {
    const limit = parseInt(newLimit, 10)
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_PER_PAGE, limit.toString())
    setPagination(prev => ({ ...prev, limit, page: 1 }))
    fetchTransactions(1, limit)
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    statsLoading,
    stats,
    pagination,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    fetchTransactions,
    fetchStats,
    handlePageChange,
    handlePageSizeChange,
  }
}

