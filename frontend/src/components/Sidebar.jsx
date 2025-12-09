import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiHome, 
  FiDollarSign, 
  FiPieChart, 
  FiTarget, 
  FiBarChart2, 
  FiUser, 
  FiLogOut,
  FiX
} from 'react-icons/fi'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      
      // On desktop, sidebar should always be visible
      if (!mobile) {
        setSidebarOpen(false) // Reset state, but sidebar will show via CSS
      } else {
        // On mobile, close sidebar if it was open
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile, setSidebarOpen])

  // Handle click outside (mobile only)
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const handleClickOutside = (e) => {
      if (
        !e.target.closest('.sidebar') &&
        !e.target.closest('button[aria-label="Open sidebar"]') &&
        !e.target.closest('[data-sidebar-toggle]')
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen, isMobile, setSidebarOpen])

  // Mark as animated after first render
  useEffect(() => {
    if (!hasAnimated) {
      setHasAnimated(true)
    }
  }, [hasAnimated])

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      toast.success('Logged out successfully')
      setTimeout(() => {
        navigate('/login')
      }, 300)
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const menuItems = [
    {
      name: 'Insights',
      href: '/insights',
      icon: FiHome,
      action: null,
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: FiDollarSign,
      action: null,
    },
    {
      name: 'Budgets',
      href: '/budgets',
      icon: FiPieChart,
      action: null,
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: FiTarget,
      action: null,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FiBarChart2,
      action: null,
    },
    {
      name: 'Currency Converter',
      href: '/currency',
      icon: FiDollarSign,
      action: null,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: FiUser,
      action: null,
    },
  ]

  // Determine if sidebar should be visible
  const shouldShow = !isMobile || sidebarOpen

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (sidebarOpen ? 0 : -256) : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={`sidebar fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl ${
          !isMobile ? 'translate-x-0' : ''
        }`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Close button for mobile */}
          {isMobile && (
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Close sidebar"
              >
                <FiX className="icon-md" aria-hidden="true" />
              </motion.button>
            </div>
          )}

          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => {
                      if (isMobile) {
                        setSidebarOpen(false)
                      }
                    }}
                    className={`flex items-center p-3 text-base font-medium rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? 'bg-primary text-white dark:bg-primary-600 shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon
                      className={`icon-md ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="ml-3">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}

            {/* Logout button */}
            <li className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center w-full p-3 text-base font-medium rounded-lg text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <FiLogOut className="icon-md" aria-hidden="true" />
                <span className="ml-3">Logout</span>
              </motion.button>
            </li>
          </ul>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
