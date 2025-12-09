import axios from '@/utils/axios'
import toast from 'react-hot-toast'
import logger from './logger'
import { API_TIMEOUTS } from './constants'

// Parse CSV line handling quoted fields
export const parseCSVLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  // Push last field
  result.push(current.trim())
  return result
}

// Parse CSV file
export const parseCSVFile = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headerLine = parseCSVLine(lines[0])
  const headers = headerLine.map((h) => {
    let header = h.trim().toLowerCase()
    if (header.startsWith('"') && header.endsWith('"')) {
      header = header.slice(1, -1)
    }
    return header.replace(/\s+/g, '')
  })

  const transactions = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    
    try {
      const values = parseCSVLine(lines[i])
      const transaction = {}
      
      headers.forEach((header, index) => {
        let value = (values[index] || '').trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"')
        }
        transaction[header] = value
      })
      
      const getField = (fieldName) => {
        const normalized = fieldName.toLowerCase().replace(/\s+/g, '')
        return transaction[normalized] || transaction[fieldName] || ''
      }
      
      const mappedTransaction = {
        title: getField('title'),
        amount: getField('amount'),
        type: getField('type').toLowerCase(),
        category: getField('category'),
        date: getField('date'),
        recurring: getField('recurring') || 'No',
        note: getField('note') || '',
      }
      
      if (mappedTransaction.title && mappedTransaction.amount && mappedTransaction.type && mappedTransaction.category && mappedTransaction.date) {
        transactions.push(mappedTransaction)
      }
    } catch (parseError) {
      logger.warn(`Error parsing line ${i + 1}:`, parseError)
    }
  }

  if (transactions.length === 0) {
    throw new Error('No valid transactions found in CSV file')
  }

  return transactions
}

// Export CSV
export const exportCSV = async (filters) => {
  try {
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (filters.category) params.append('category', filters.category)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const response = await axios.get(`/api/export/csv?${params.toString()}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `transactions_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('CSV exported successfully')
  } catch (error) {
    logger.error('Export error:', error)
    toast.error(error.response?.data?.message || 'Failed to export CSV')
  }
}

// Export PDF
export const exportPDF = async (filters) => {
  try {
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (filters.category) params.append('category', filters.category)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const response = await axios.get(`/api/export/pdf?${params.toString()}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `transactions_${Date.now()}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('PDF exported successfully')
  } catch (error) {
    logger.error('Export error:', error)
    toast.error(error.response?.data?.message || 'Failed to export PDF')
  }
}

// Import CSV
export const importCSV = async (file, onSuccess) => {
  if (!file.name.endsWith('.csv')) {
    toast.error('Please select a CSV file')
    return
  }

  try {
    const text = await file.text()
    const transactions = parseCSVFile(text)

    const response = await axios.post('/api/export/import', { transactions }, {
      timeout: API_TIMEOUTS.IMPORT
    })
    
    toast.success(
      `Imported ${response.data.data.success.length} transactions. ${response.data.data.errors.length} errors. ${response.data.data.duplicates?.length || 0} duplicates skipped.`
    )
    
    if (onSuccess) {
      onSuccess()
    }
  } catch (error) {
    logger.error('Import error:', error)
    if (error.code === 'ECONNABORTED') {
      toast.error('Import timeout. Please try with a smaller file or check your connection.')
    } else if (error.message === 'CSV file is empty') {
      toast.error('CSV file is empty')
    } else if (error.message === 'No valid transactions found in CSV file') {
      toast.error('No valid transactions found in CSV file')
    } else {
      toast.error(error.response?.data?.message || 'Failed to import CSV. Please check the file format.')
    }
  }
}

