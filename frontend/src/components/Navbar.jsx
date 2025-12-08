import { useSelector } from 'react-redux'
import DarkModeToggle from './DarkModeToggle'

const Navbar = ({ setSidebarOpen }) => {
  const { user } = useSelector((state) => state.auth)

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                App
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
              {user?.name}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

