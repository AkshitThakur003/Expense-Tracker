/**
 * Logger utility for consistent error and debug logging
 * Can be extended to send logs to external services in production
 */

const isDevelopment = import.meta.env.DEV

class Logger {
  error(message, error = null) {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '')
    }
    // In production, you could send to error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  warn(message, data = null) {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '')
    }
  }

  info(message, data = null) {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data || '')
    }
  }

  debug(message, data = null) {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  }
}

export const logger = new Logger()
export default logger

