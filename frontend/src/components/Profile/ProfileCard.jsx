import PropTypes from 'prop-types'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiEdit2 } from 'react-icons/fi'

const ProfileCard = memo(({ user, onEditClick }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center shadow-lg"
      >
        <FiUser className="w-12 h-12 text-white" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {user?.name}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {user?.email}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEditClick}
        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        aria-label="Edit profile"
      >
        <FiEdit2 className="w-4 h-4" />
        Edit Profile
      </motion.button>
    </div>
  )
})

ProfileCard.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onEditClick: PropTypes.func.isRequired,
}

ProfileCard.displayName = 'ProfileCard'

export default ProfileCard

