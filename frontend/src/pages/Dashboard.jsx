import { useState } from 'react'
import { useSelector } from 'react-redux'
import axios from '@/utils/axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testProtectedEndpoint = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await axios.get('/api/test/protected')
      setTestResult({
        success: true,
        data: response.data,
      })
      toast.success('Protected endpoint test successful!')
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.message || error.message || 'Request failed',
      })
      toast.error('Protected endpoint test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Hello, {user?.name}!
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Placeholder
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add your content here
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Placeholder
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add your content here
          </p>
        </div>
      </div>

      {/* Test Protected Endpoint */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Test Protected API
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Click the button below to test the protected endpoint and verify authentication is working.
        </p>
        <button
          onClick={testProtectedEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Protected Endpoint'}
        </button>

        {testResult && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {testResult.success ? '✅ Success Response:' : '❌ Error Response:'}
            </h3>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
              {JSON.stringify(testResult.success ? testResult.data : { error: testResult.error }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

