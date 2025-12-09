import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave, FiAlertCircle } from 'react-icons/fi'
import { NOTIFICATION_PREFERENCES } from '../../utils/constants'

const NotificationsModal = ({
  isOpen,
  onClose,
  pushSupported,
  notificationPermission,
  isPushSubscribed,
  subscriptionLoading,
  notificationPrefs,
  setNotificationPrefs,
  handleSubscribePush,
  handleUnsubscribePush,
  handleUpdatePreferences,
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
                Notification Preferences
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

            <div className="space-y-6">
              {!pushSupported ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Push Notifications Not Supported
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Push Notifications
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isPushSubscribed
                            ? 'You are subscribed to push notifications'
                            : 'Enable push notifications to receive alerts'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isPushSubscribed
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {isPushSubscribed ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Browser Permission: <span className={`font-medium capitalize ${
                          notificationPermission === 'granted' 
                            ? 'text-green-600 dark:text-green-400'
                            : notificationPermission === 'denied'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {notificationPermission}
                        </span>
                      </p>
                      {notificationPermission === 'denied' && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-1">
                            Notifications are blocked
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            To enable notifications:
                          </p>
                          <ol className="text-xs text-red-600 dark:text-red-400 mt-1 ml-4 list-decimal space-y-1">
                            <li>Click the lock icon in your browser's address bar</li>
                            <li>Find "Notifications" and change it to "Allow"</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      )}
                    </div>

                    {!isPushSubscribed ? (
                      <button
                        onClick={handleSubscribePush}
                        disabled={subscriptionLoading || notificationPermission === 'denied'}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {subscriptionLoading ? 'Enabling...' : 'Enable Push Notifications'}
                      </button>
                    ) : (
                      <button
                        onClick={handleUnsubscribePush}
                        disabled={subscriptionLoading}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {subscriptionLoading ? 'Disabling...' : 'Disable Push Notifications'}
                      </button>
                    )}
                  </div>

                  {isPushSubscribed && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Notification Preferences
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose which notifications you want to receive
                      </p>

                      <div className="space-y-3">
                        {NOTIFICATION_PREFERENCES.map((pref) => (
                          <label
                            key={pref.key}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={notificationPrefs[pref.key]}
                              onChange={(e) =>
                                setNotificationPrefs({
                                  ...notificationPrefs,
                                  [pref.key]: e.target.checked,
                                })
                              }
                              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {pref.label}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {pref.desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <button
                        onClick={handleUpdatePreferences}
                        disabled={subscriptionLoading}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FiSave className="w-4 h-4" />
                        {subscriptionLoading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NotificationsModal

