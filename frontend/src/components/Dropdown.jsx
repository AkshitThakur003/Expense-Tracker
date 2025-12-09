import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown, FiCheck } from 'react-icons/fi'

const Dropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = false,
  className = '',
  disabled = false,
  label,
  error,
  required = false,
  name,
  id,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // Get selected option label (handle both string and number comparisons)
  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  const displayValue = selectedOption?.label || placeholder

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input if searchable
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, searchable])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchQuery('')
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setIsOpen(false)
        }
        break
      default:
        break
    }
  }

  const handleSelect = (option) => {
    if (option.disabled) return
    onChange(option.value)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id || name}
          name={name}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label || placeholder}
          className={`
            w-full px-4 py-2.5 text-left bg-white dark:bg-gray-700 border rounded-lg
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center justify-between
            ${error ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-gray-600'}
            ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
          `}
          {...props}
        >
          <span className={`truncate ${!selectedOption ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {displayValue}
          </span>
          <FiChevronDown
            className={`w-5 h-5 text-gray-400 dark:text-gray-400 transition-transform flex-shrink-0 ml-2 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden"
              role="listbox"
            >
              {searchable && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = String(value) === String(option.value)
                    const isDisabled = option.disabled

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option)}
                        disabled={isDisabled}
                        role="option"
                        aria-selected={isSelected}
                        className={`
                          w-full px-4 py-2.5 text-left text-sm transition-colors
                          flex items-center justify-between
                          ${isSelected
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-300'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                          ${isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                          }
                        `}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <FiCheck className="w-5 h-5 text-primary flex-shrink-0 ml-2" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Dropdown

