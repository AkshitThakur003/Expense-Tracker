import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar setSidebarOpen={setSidebarOpen} />
      <div className="flex pt-16">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

