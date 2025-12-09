const express = require('express');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');
const { 
  convertCurrency, 
  formatCurrency, 
  getCurrencySymbol, 
  getExchangeRates,
  getCurrentRates,
  fetchExchangeRates,
  supportedCurrencies
} = require('../utils/currencyConverter');
const { sendErrorResponse } = require('../utils/errorHandler');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   GET /api/currency/rates
// @desc    Get exchange rates (real-time with caching)
// @access  Private
router.get('/rates', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const rates = await getExchangeRates(forceRefresh);
    
    res.json({
      success: true,
      data: rates,
      lastUpdated: new Date().toISOString(),
      supportedCurrencies,
    });
  } catch (error) {
    logger.error('Error fetching exchange rates:', error);
    // Return cached rates even if refresh fails
    res.json({
      success: true,
      data: getCurrentRates(),
      lastUpdated: new Date().toISOString(),
      supportedCurrencies,
      warning: 'Using cached rates',
    });
  }
});

// @route   POST /api/currency/refresh
// @desc    Force refresh exchange rates
// @access  Private
router.post('/refresh', async (req, res) => {
  try {
    const rates = await fetchExchangeRates();
    res.json({
      success: true,
      message: 'Exchange rates refreshed successfully',
      data: rates,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error refreshing exchange rates:', error);
    return sendErrorResponse(res, 500, 'Failed to refresh exchange rates');
  }
});

// @route   POST /api/currency/convert
// @desc    Convert currency (uses real-time rates)
// @access  Private
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return sendErrorResponse(res, 400, 'Amount, from, and to currencies are required');
    }

    if (!supportedCurrencies.includes(from) || !supportedCurrencies.includes(to)) {
      return sendErrorResponse(res, 400, 'Unsupported currency. Supported currencies: ' + supportedCurrencies.join(', '));
    }

    // Get latest rates
    const rates = await getExchangeRates();
    const converted = convertCurrency(parseFloat(amount), from, to, rates);
    const formatted = formatCurrency(converted, to);
    const exchangeRate = rates[to] / rates[from];

    res.json({
      success: true,
      data: {
        original: {
          amount: parseFloat(amount),
          currency: from,
          formatted: formatCurrency(amount, from),
        },
        converted: {
          amount: converted,
          currency: to,
          formatted,
        },
        rate: exchangeRate,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Currency conversion error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   GET /api/currency/symbols
// @desc    Get currency symbols
// @access  Private
router.get('/symbols', (req, res) => {
  const symbols = {};
  supportedCurrencies.forEach((currency) => {
    symbols[currency] = getCurrencySymbol(currency);
  });

  res.json({
    success: true,
    data: symbols,
  });
});

// @route   GET /api/currency/supported
// @desc    Get list of supported currencies
// @access  Private
router.get('/supported', (req, res) => {
  res.json({
    success: true,
    data: supportedCurrencies,
  });
});

module.exports = router;

