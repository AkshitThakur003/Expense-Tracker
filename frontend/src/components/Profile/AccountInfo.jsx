import PropTypes from 'prop-types'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi'

const AccountInfo = memo(({ user }) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Account Information
      </h3>
      <div className="space-y-6">
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <FiUser className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Full Name
            </label>
            <div className="text-gray-900 dark:text-white font-medium text-lg">
              {user?.name}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <FiMail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email Address
            </label>
            <div className="text-gray-900 dark:text-white font-medium text-lg">
              {user?.email}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <FiCalendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Member Since
            </label>
            <div className="text-gray-900 dark:text-white font-medium text-lg">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AccountInfo

