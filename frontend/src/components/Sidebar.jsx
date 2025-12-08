import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    // Close sidebar on outside click for mobile
    const handleClickOutside = (e) => {
      if (
        sidebarOpen &&
        window.innerWidth < 1024 &&
        !e.target.closest('.sidebar') &&
        !e.target.closest('button[aria-label="Open sidebar"]')
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen, setSidebarOpen])

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname, setSidebarOpen])

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      toast.success('Logged out successfully')
      navigate('/login')
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      action: null,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      action: null,
    },
    {
      name: 'Logout',
      href: '#',
      icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      action: handleLogout,
    },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = item.action === null && location.pathname === item.href
              const baseClasses = `flex items-center p-2.5 text-base font-normal rounded-lg transition-colors duration-200`
              const activeClasses = isActive
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              
              const iconClasses = isActive
                ? 'text-white dark:text-white'
                : 'text-gray-500 dark:text-gray-400'

              if (item.action) {
                return (
                  <li key={item.name}>
                    <button
                      onClick={item.action}
                      className={`${baseClasses} ${activeClasses} w-full text-left`}
                    >
                      <svg
                        className={`w-6 h-6 ${iconClasses} transition-colors duration-200`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                      <span className="ml-3">{item.name}</span>
                    </button>
                  </li>
                )
              }

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false)
                      }
                    }}
                    className={`${baseClasses} ${activeClasses}`}
                  >
                    <svg
                      className={`w-6 h-6 ${iconClasses} transition-colors duration-200`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

