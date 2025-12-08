import axios from 'axios'

// Get API base URL directly to avoid circular dependency issues
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  return import.meta.env.VITE_API_URL || ''
}

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Initialize interceptors lazily to avoid circular dependency
let interceptorsInitialized = false

const initializeInterceptors = () => {
  if (interceptorsInitialized) return

  // Request interceptor
  axiosInstance.interceptors.request.use(
    (requestConfig) => {
      // Get token from localStorage (available immediately)
      const token = localStorage.getItem('token')
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }
      return requestConfig
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // Get refresh token from localStorage (avoids store dependency)
          const refreshToken = localStorage.getItem('refreshToken')
          
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          // Use fetch API to avoid circular dependency with axios
          const refreshResponse = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          })

          if (!refreshResponse.ok) {
            throw new Error('Token refresh failed')
          }

          const refreshData = await refreshResponse.json()
          const { token } = refreshData.data

          // Update token in localStorage
          localStorage.setItem('token', token)
          
          // Update Redux store dynamically (non-blocking)
          try {
            const { store } = await import('../redux/store')
            if (store) {
              store.dispatch({ type: 'auth/setToken', payload: token })
            }
          } catch (storeError) {
            // Store not available yet, but that's okay - localStorage has the token
            // Silently fail - token is already saved to localStorage
          }

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          
          // Update Redux store dynamically (non-blocking)
          try {
            const { store } = await import('../redux/store')
            if (store) {
              store.dispatch({ type: 'auth/logout' })
            }
          } catch (storeError) {
            // Store not available, but cleanup is done
            // Silently fail - localStorage already cleared
          }
          
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )

  interceptorsInitialized = true
}

// Auto-initialize interceptors on first use (lazy initialization)
const originalRequest = axiosInstance.request.bind(axiosInstance)
axiosInstance.request = function(...args) {
  initializeInterceptors()
  return originalRequest(...args)
}

// Also initialize for other methods
const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
methods.forEach(method => {
  const original = axiosInstance[method].bind(axiosInstance)
  axiosInstance[method] = function(...args) {
    initializeInterceptors()
    return original(...args)
  }
})

export default axiosInstance
