import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave } from 'react-icons/fi'
import Dropdown from '../Dropdown'

const CurrencyModal = ({ 
  isOpen, 
  onClose, 
  selectedCurrency, 
  setSelectedCurrency, 
  handleCurrencyChange, 
  supportedCurrencies, 
  getCurrencySymbol, 
  user, 
  loading 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Currency Preference
              </h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <FiX className="w-6 h-6" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select your preferred currency. All amounts will be displayed in this currency.
              </p>
              
              <div className="mb-6">
                <Dropdown
                  label="Currency"
                  value={selectedCurrency}
                  onChange={setSelectedCurrency}
                  options={supportedCurrencies.map((currency) => ({
                    value: currency,
                    label: `${getCurrencySymbol(currency)} ${currency}`,
                  }))}
                  placeholder="Select Currency"
                  searchable
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Current:</strong> {getCurrencySymbol(user?.currency)} {user?.currency || 'INR'}
                </p>
                {selectedCurrency !== user?.currency && (
                  <p className="text-sm text-primary mt-1">
                    <strong>New:</strong> {getCurrencySymbol(selectedCurrency)} {selectedCurrency}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCurrencyChange}
                  disabled={loading || selectedCurrency === user?.currency}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CurrencyModal

