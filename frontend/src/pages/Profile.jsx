import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { FiLock, FiBell, FiDollarSign } from 'react-icons/fi'
import { updateProfile, changePassword, updateCurrency } from '../redux/slices/authSlice'
import { useCurrency } from '../hooks/useCurrency'
import toast from 'react-hot-toast'
import PageTransition from '../components/PageTransition'
import ProfileCard from '../components/Profile/ProfileCard'
import AccountInfo from '../components/Profile/AccountInfo'
import EditProfileModal from '../components/Profile/EditProfileModal'
import ChangePasswordModal from '../components/Profile/ChangePasswordModal'
import CurrencyModal from '../components/Profile/CurrencyModal'
import NotificationsModal from '../components/Profile/NotificationsModal'
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  updateNotificationPreferences,
  isSubscribed,
} from '../utils/pushNotifications'
import logger from '../utils/logger'
import { SUPPORTED_CURRENCIES, NOTIFICATION_PREFERENCES } from '../utils/constants'

const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const { formatCurrency, getCurrencySymbol } = useCurrency()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false)
  
  // Push notification state
  const [pushSupported, setPushSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState({
    budgetAlerts: true,
    goalAchievements: true,
    monthlyReports: true,
    spendingAlerts: true,
  })
  
  // Edit Profile Form
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
  })
  const [editErrors, setEditErrors] = useState({})

  // Password Form
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  // Currency selection
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR')
  const supportedCurrencies = SUPPORTED_CURRENCIES

  useEffect(() => {
    if (user?.currency) {
      setSelectedCurrency(user.currency)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name || '',
        email: user.email || '',
      })
    }
  }, [user])

  // Check push notification support and status
  useEffect(() => {
    const checkPushSupport = async () => {
      const supported = isPushNotificationSupported()
      setPushSupported(supported)
      
      if (supported) {
        const permission = getNotificationPermission()
        setNotificationPermission(permission)
        
        const subscribed = await isSubscribed()
        setIsPushSubscribed(subscribed)
        
        if (subscribed) {
          const subscription = await getPushSubscription()
          if (subscription?.notificationPreferences) {
            setNotificationPrefs(subscription.notificationPreferences)
          }
        }
      }
    }
    
    checkPushSupport()
  }, [])

  const validateEditForm = () => {
    const errors = {}
    if (!editFormData.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Please enter a valid email'
    }
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordForm = () => {
    const errors = {}
    if (!passwordFormData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }
    if (!passwordFormData.newPassword) {
      errors.newPassword = 'New password is required'
    } else if (passwordFormData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters'
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    if (!validateEditForm()) return

    try {
      await dispatch(updateProfile(editFormData)).unwrap()
      toast.success('Profile updated successfully')
      setIsEditModalOpen(false)
      setEditErrors({})
    } catch (error) {
      toast.error(error || 'Failed to update profile')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePasswordForm()) return

    try {
      await dispatch(changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      })).unwrap()
      toast.success('Password changed successfully')
      setIsPasswordModalOpen(false)
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordErrors({})
    } catch (error) {
      toast.error(error || 'Failed to change password')
    }
  }

  const handleCurrencyChange = async () => {
    if (selectedCurrency === user?.currency) {
      setIsCurrencyModalOpen(false)
      return
    }

    try {
      await dispatch(updateCurrency(selectedCurrency)).unwrap()
      toast.success('Currency preference updated successfully')
      setIsCurrencyModalOpen(false)
    } catch (error) {
      toast.error(error || 'Failed to update currency')
    }
  }

  // Push notification handlers
  const handleSubscribePush = async () => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported in this browser')
      return
    }

    if (notificationPermission === 'denied') {
      toast.error(
        'Notifications are blocked. Please enable them in your browser settings and refresh the page.',
        { duration: 6000 }
      )
      return
    }

    setSubscriptionLoading(true)
    try {
      await requestNotificationPermission()
      await subscribeToPushNotifications(notificationPrefs)
      setIsPushSubscribed(true)
      setNotificationPermission('granted')
      toast.success('Push notifications enabled successfully!')
    } catch (error) {
      logger.error('Subscribe error:', error)
      
      if (error.message === 'PERMISSION_DENIED') {
        setNotificationPermission('denied')
        toast.error(
          'Notification permission was denied. Please enable notifications in your browser settings (lock icon in address bar) and refresh the page.',
          { duration: 8000 }
        )
      } else {
        toast.error(error.message || 'Failed to enable push notifications')
      }
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleUnsubscribePush = async () => {
    setSubscriptionLoading(true)
    try {
      await unsubscribeFromPushNotifications()
      setIsPushSubscribed(false)
      toast.success('Push notifications disabled')
    } catch (error) {
      logger.error('Unsubscribe error:', error)
      toast.error(error.message || 'Failed to disable push notifications')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleUpdatePreferences = async () => {
    if (!isPushSubscribed) {
      toast.error('Please enable push notifications first')
      return
    }

    setSubscriptionLoading(true)
    try {
      await updateNotificationPreferences(notificationPrefs)
      toast.success('Notification preferences updated')
    } catch (error) {
      logger.error('Update preferences error:', error)
      toast.error(error.message || 'Failed to update preferences')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <PageTransition>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <ProfileCard user={user} onEditClick={() => setIsEditModalOpen(true)} />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2">
            <AccountInfo user={user} />
          </motion.div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsPasswordModalOpen(true)}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              aria-label="Change password"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <FiLock className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-13">
                Update your account password
              </p>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCurrencyModalOpen(true)}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              aria-label="Currency preferences"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Currency Preference
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-13">
                Current: {getCurrencySymbol()} {user?.currency || 'INR'}
              </p>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsNotificationsModalOpen(true)}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              aria-label="Notification preferences"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <FiBell className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-13">
                Manage your notification settings
              </p>
            </motion.button>
          </div>
        </motion.div>

        {/* Modals */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditErrors({})
          }}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          handleEditProfile={handleEditProfile}
          editErrors={editErrors}
          loading={loading}
        />

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false)
            setPasswordFormData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })
            setPasswordErrors({})
          }}
          passwordFormData={passwordFormData}
          setPasswordFormData={setPasswordFormData}
          handleChangePassword={handleChangePassword}
          passwordErrors={passwordErrors}
          loading={loading}
        />

        <CurrencyModal
          isOpen={isCurrencyModalOpen}
          onClose={() => {
            setIsCurrencyModalOpen(false)
            setSelectedCurrency(user?.currency || 'INR')
          }}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          handleCurrencyChange={handleCurrencyChange}
          supportedCurrencies={supportedCurrencies}
          getCurrencySymbol={getCurrencySymbol}
          user={user}
          loading={loading}
        />

        <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          pushSupported={pushSupported}
          notificationPermission={notificationPermission}
          isPushSubscribed={isPushSubscribed}
          subscriptionLoading={subscriptionLoading}
          notificationPrefs={notificationPrefs}
          setNotificationPrefs={setNotificationPrefs}
          handleSubscribePush={handleSubscribePush}
          handleUnsubscribePush={handleUnsubscribePush}
          handleUpdatePreferences={handleUpdatePreferences}
        />
      </div>
    </PageTransition>
  )
}

export default Profile

