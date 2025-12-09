import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiRefreshCw, FiArrowRight, FiDollarSign, FiInfo } from 'react-icons/fi'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import LoadingSpinner from '../components/LoadingSpinner'
import Dropdown from '../components/Dropdown'
import { useCurrency } from '../hooks/useCurrency'

const CurrencyConverter = () => {
  const { formatCurrency, getCurrencySymbol, currencySymbols, userCurrency } = useCurrency()
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState(userCurrency)
  const [toCurrency, setToCurrency] = useState('USD')
  const [convertedAmount, setConvertedAmount] = useState(null)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY']

  const fetchExchangeRates = async (forceRefresh = false) => {
    setRatesLoading(true)
    try {
      const response = await axios.get(`/api/currency/rates?refresh=${forceRefresh}`)
      if (response.data.success) {
        setRates(response.data.data)
        setLastUpdated(response.data.lastUpdated)
      }
    } catch (error) {
      logger.error('Failed to fetch exchange rates:', error)
      toast.error('Failed to fetch exchange rates')
    } finally {
      setRatesLoading(false)
    }
  }

  useEffect(() => {
    if (userCurrency) {
      setFromCurrency(userCurrency)
    }
    fetchExchangeRates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCurrency])

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (fromCurrency === toCurrency) {
      setConvertedAmount(parseFloat(amount))
      setExchangeRate(1)
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/currency/convert', {
        amount: parseFloat(amount),
        from: fromCurrency,
        to: toCurrency,
      })

      if (response.data.success) {
        setConvertedAmount(response.data.data.converted.amount)
        setExchangeRate(response.data.data.rate)
      }
    } catch (error) {
      logger.error('Currency conversion failed:', error)
      toast.error(error.response?.data?.message || 'Failed to convert currency')
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setConvertedAmount(null)
    setExchangeRate(null)
  }

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Currency Converter
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert between different currencies using real-time exchange rates
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Converter Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setConvertedAmount(null)
                    setExchangeRate(null)
                  }}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* From Currency */}
              <Dropdown
                label="From"
                value={fromCurrency}
                onChange={(value) => {
                  setFromCurrency(value)
                  setConvertedAmount(null)
                  setExchangeRate(null)
                }}
                options={supportedCurrencies.map((currency) => ({
                  value: currency,
                  label: `${getCurrencySymbol(currency)} ${currency}`,
                }))}
                placeholder="Select Currency"
                searchable
              />

              {/* Swap Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwap}
                  className="p-3 bg-primary/10 dark:bg-primary/20 rounded-full text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                  aria-label="Swap currencies"
                >
                  <FiArrowRight className="w-6 h-6" />
                </motion.button>
              </div>

              {/* To Currency */}
              <Dropdown
                label="To"
                value={toCurrency}
                onChange={(value) => {
                  setToCurrency(value)
                  setConvertedAmount(null)
                  setExchangeRate(null)
                }}
                options={supportedCurrencies.map((currency) => ({
                  value: currency,
                  label: `${getCurrencySymbol(currency)} ${currency}`,
                }))}
                placeholder="Select Currency"
                searchable
              />

              {/* Convert Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConvert}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {loading ? 'Converting...' : 'Convert'}
              </motion.button>

              {/* Result */}
              {convertedAmount !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-6 border border-primary/20"
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Converted Amount</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {formatCurrency(convertedAmount, toCurrency)}
                    </p>
                    {exchangeRate && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Exchange Rates Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiDollarSign className="w-5 h-5" />
                Exchange Rates
              </h3>
              <motion.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fetchExchangeRates(true)}
                disabled={ratesLoading}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Refresh rates"
              >
                <FiRefreshCw className={`w-5 h-5 ${ratesLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>

            {ratesLoading && !rates ? (
              <LoadingSpinner size="sm" />
            ) : rates ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {lastUpdated && (
                    <p>Last updated: {new Date(lastUpdated).toLocaleString()}</p>
                  )}
                </div>
                {supportedCurrencies
                  .filter((currency) => currency !== userCurrency)
                  .slice(0, 6)
                  .map((currency) => {
                    const rate = rates[currency] / rates[userCurrency]
                    return (
                      <div
                        key={currency}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {getCurrencySymbol(currency)} {currency}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          1 {userCurrency} = {rate.toFixed(4)} {currency}
                        </span>
                      </div>
                    )
                  })}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Rates are updated hourly. Base currency: {getCurrencySymbol(userCurrency)} {userCurrency}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Failed to load exchange rates
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}

export default CurrencyConverter

