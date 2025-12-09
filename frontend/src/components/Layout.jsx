import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Breadcrumbs from './Breadcrumbs'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle window resize - only manage mobile state
  useEffect(() => {
    const handleResize = () => {
      // On desktop, always keep sidebar closed state (it will show via CSS)
      // On mobile, close sidebar when resizing
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      } else if (window.innerWidth < 1024 && sidebarOpen) {
        // Keep current state on mobile
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar setSidebarOpen={setSidebarOpen} />
      <div className="flex pt-16">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-4 sm:p-6 lg:p-8">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
