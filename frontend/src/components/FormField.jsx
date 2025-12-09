import { useState, useEffect } from 'react'
import { FiAlertCircle } from 'react-icons/fi'

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  className = '',
  icon: Icon,
  ...props
}) => {
  const [touched, setTouched] = useState(false)
  const showError = touched && error

  const handleBlur = (e) => {
    setTouched(true)
    if (onBlur) onBlur(e)
  }

  useEffect(() => {
    if (error) setTouched(true)
  }, [error])

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${name}-error` : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
            placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${showError
              ? 'border-danger focus:ring-danger focus:border-danger'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
            }
          `}
          {...props}
        />
      </div>
      {showError && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-danger flex items-center gap-1"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField

