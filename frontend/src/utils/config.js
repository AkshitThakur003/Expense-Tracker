// API Configuration
// This file handles environment-specific API base URLs

const getApiBaseUrl = () => {
  // Check for explicit VITE_API_URL first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }

  // Production mode - use relative URL or environment variable
  // For Vercel/Netlify deployments, use relative URL
  // For custom domains, set VITE_API_URL in environment variables
  return import.meta.env.VITE_API_URL || ''
}

export const config = {
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: 10000, // 10 seconds
}

export default config

