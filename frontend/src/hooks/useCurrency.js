import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from '@/utils/axios'

// Currency symbols mapping
const currencySymbols = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
}

export const useCurrency = () => {
  const { user } = useSelector((state) => state.auth)
  const [currencySymbolsData, setCurrencySymbolsData] = useState(currencySymbols)
  const [exchangeRates, setExchangeRates] = useState(null)
  const [loading, setLoading] = useState(false)

  // Get user's currency preference (defaults to INR)
  const userCurrency = user?.currency || 'INR'

  // Fetch currency symbols from backend (optional, for consistency)
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await axios.get('/api/currency/symbols')
        if (response.data.success) {
          setCurrencySymbolsData(response.data.data)
        }
      } catch (error) {
        // Use default symbols if API fails
        logger.warn('Failed to fetch currency symbols, using defaults')
      }
    }
    fetchSymbols()
  }, [])

  // Format currency amount
  const formatCurrency = (amount, currency = null) => {
    const currencyToUse = currency || userCurrency
    const symbol = currencySymbolsData[currencyToUse] || currencyToUse
    const locale = currencyToUse === 'INR' ? 'en-IN' : 'en-US'
    
    return `${symbol}${parseFloat(amount || 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Get currency symbol
  const getCurrencySymbol = (currency = null) => {
    const currencyToUse = currency || userCurrency
    return currencySymbolsData[currencyToUse] || currencyToUse
  }

  // Fetch exchange rates
  const fetchExchangeRates = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/currency/rates?refresh=${forceRefresh}`)
      if (response.data.success) {
        setExchangeRates(response.data.data)
        return response.data.data
      }
    } catch (error) {
      logger.error('Failed to fetch exchange rates:', error)
    } finally {
      setLoading(false)
    }
    return null
  }

  // Convert currency
  const convertCurrency = async (amount, from, to) => {
    try {
      const response = await axios.post('/api/currency/convert', {
        amount,
        from,
        to,
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      logger.error('Currency conversion failed:', error)
      throw error
    }
  }

  return {
    userCurrency,
    formatCurrency,
    getCurrencySymbol,
    currencySymbols: currencySymbolsData,
    exchangeRates,
    fetchExchangeRates,
    convertCurrency,
    loading,
  }
}

