const axios = require('axios');
const logger = require('./logger');

// Fallback static rates (used if API fails)
const fallbackRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  JPY: 1.8,
  AUD: 0.018,
  CAD: 0.016,
  CHF: 0.011,
  CNY: 0.087,
};

// Cache for exchange rates (updated every hour)
let exchangeRatesCache = { ...fallbackRates };
let lastUpdate = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Supported currencies
const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];

// Fetch real-time exchange rates from exchangerate-api.io
const fetchExchangeRates = async (retryCount = 0) => {
  const MAX_RETRIES = 2;
  const TIMEOUT = 10000; // Increased to 10 seconds (was 5 seconds)
  
  try {
    // Using exchangerate-api.io free tier (no API key required for base currency)
    // Base currency is USD, we'll convert to INR as our primary currency
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: TIMEOUT,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.data && response.data.rates) {
      const rates = response.data.rates;
      const usdToInr = rates.INR || 83; // Fallback if INR not available
      
      // Convert all rates to INR base
      const inrBasedRates = {
        INR: 1,
        USD: 1 / usdToInr,
        EUR: (1 / rates.EUR) / usdToInr,
        GBP: (1 / rates.GBP) / usdToInr,
        JPY: (1 / rates.JPY) / usdToInr,
        AUD: (1 / rates.AUD) / usdToInr,
        CAD: (1 / rates.CAD) / usdToInr,
        CHF: (1 / rates.CHF) / usdToInr,
        CNY: (1 / rates.CNY) / usdToInr,
      };

      // Validate all rates exist and are valid numbers
      const allRatesValid = supportedCurrencies.every(currency => 
        inrBasedRates[currency] && !isNaN(inrBasedRates[currency]) && isFinite(inrBasedRates[currency]) && inrBasedRates[currency] > 0
      );

      if (allRatesValid) {
        exchangeRatesCache = inrBasedRates;
        lastUpdate = Date.now();
        logger.info('✅ Exchange rates updated successfully');
        return inrBasedRates;
      }
    }
    
    throw new Error('Invalid API response');
  } catch (error) {
    // Retry logic for network errors (timeout, connection issues)
    if (retryCount < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND')) {
      logger.warn(`⚠️ Exchange rate API timeout/error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying in 1 second...`);
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchExchangeRates(retryCount + 1);
    }
    
    // Log warning but don't treat as critical error (fallback rates will be used)
    // The app will continue to work with cached/fallback rates
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      logger.warn('⚠️ Exchange rate API timeout - using cached/fallback rates. This is not critical - the app will continue to work normally.');
    } else if (error.code === 'ENOTFOUND') {
      logger.warn('⚠️ Exchange rate API not reachable - using cached/fallback rates. Check internet connection.');
    } else {
      logger.warn(`⚠️ Failed to fetch real-time exchange rates, using fallback: ${error.message}`);
    }
    
    return fallbackRates;
  }
};

// Get exchange rates (with caching)
const getExchangeRates = async (forceRefresh = false) => {
  const now = Date.now();
  const shouldRefresh = forceRefresh || (now - lastUpdate) > CACHE_DURATION;

  if (shouldRefresh) {
    const rates = await fetchExchangeRates();
    return rates;
  }

  return exchangeRatesCache;
};

// Initialize rates on module load (non-blocking, don't wait for it)
// This prevents server startup from being delayed if API is slow
fetchExchangeRates().catch(() => {
  // Silently fail on startup - fallback rates are already set
  logger.info('Using fallback exchange rates on startup');
});

// Export current rates (synchronous getter)
const getCurrentRates = () => exchangeRatesCache;

// Get currency symbol
const getCurrencySymbol = (currency) => {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
  };
  return symbols[currency] || currency;
};

// Convert amount from one currency to another
const convertCurrency = (amount, fromCurrency, toCurrency, rates = null) => {
  if (fromCurrency === toCurrency) return amount;
  
  const exchangeRates = rates || exchangeRatesCache;
  
  // Convert to base currency (INR) first
  const baseAmount = amount / (exchangeRates[fromCurrency] || 1);
  // Convert to target currency
  const convertedAmount = baseAmount * (exchangeRates[toCurrency] || 1);
  
  return convertedAmount;
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  const symbol = getCurrencySymbol(currency);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  
  return `${symbol}${parseFloat(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

module.exports = {
  getCurrencySymbol,
  convertCurrency,
  formatCurrency,
  getExchangeRates,
  getCurrentRates,
  fetchExchangeRates,
  supportedCurrencies,
};

