// Format currency for display
export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = currency === 'INR' ? '₹' : '$'
  return `${symbol}${parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Format currency for input (remove formatting)
export const formatCurrencyInput = (value) => {
  // Remove all non-digit characters except decimal point
  return value.replace(/[^\d.]/g, '')
}

// Parse currency from input string
export const parseCurrency = (value) => {
  const cleaned = formatCurrencyInput(value)
  const parsed = parseFloat(cleaned) || 0
  return parsed
}

// Format currency while typing
export const formatCurrencyOnInput = (value) => {
  if (!value) return ''
  
  // Remove all non-digit characters
  const cleaned = value.replace(/[^\d]/g, '')
  
  if (!cleaned) return ''
  
  // Convert to number and format
  const num = parseFloat(cleaned) / 100 // Assuming user types in paise/cents
  return formatCurrency(num)
}

