const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendErrorResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { getCurrencySymbol, formatCurrency } = require('../utils/currencyConverter');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @route   GET /api/export/csv
// @desc    Export transactions as CSV
// @access  Private
router.get('/csv', async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    // Build query
    const query = { createdBy: req.user._id };

    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get all transactions matching the query
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .select('-__v -createdBy');

    if (transactions.length === 0) {
      return sendErrorResponse(res, 404, 'No transactions found to export');
    }

    // Prepare CSV data
    const csvData = transactions.map((transaction) => ({
      Title: transaction.title,
      Amount: transaction.amount,
      Type: transaction.type,
      Category: transaction.category,
      Date: new Date(transaction.date).toISOString().split('T')[0],
      Recurring: transaction.recurring ? 'Yes' : 'No',
      Note: transaction.note || '',
      Created: new Date(transaction.createdAt).toISOString(),
    }));

    // Create temp file with proper path
    const tempFilePath = path.join(os.tmpdir(), `transactions_${Date.now()}_${Math.random().toString(36).substring(7)}.csv`);
    
    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: tempFilePath,
      header: [
        { id: 'Title', title: 'Title' },
        { id: 'Amount', title: 'Amount' },
        { id: 'Type', title: 'Type' },
        { id: 'Category', title: 'Category' },
        { id: 'Date', title: 'Date' },
        { id: 'Recurring', title: 'Recurring' },
        { id: 'Note', title: 'Note' },
        { id: 'Created', title: 'Created At' },
      ],
    });

    await csvWriter.writeRecords(csvData);

    // Send file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp CSV file:', cleanupError);
      }
    });

    fileStream.on('error', (streamError) => {
      logger.error('CSV stream error:', streamError);
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp CSV file on error:', cleanupError);
      }
    });
  } catch (error) {
    logger.error('CSV export error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   GET /api/export/pdf
// @desc    Export transactions as PDF
// @access  Private
router.get('/pdf', async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    // Get user currency preference
    const user = await User.findById(req.user._id).select('currency');
    const userCurrency = user?.currency || 'INR';
    const currencySymbol = getCurrencySymbol(userCurrency);

    // Build query
    const query = { createdBy: req.user._id };

    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get all transactions matching the query
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .select('-__v -createdBy');

    if (transactions.length === 0) {
      return sendErrorResponse(res, 404, 'No transactions found to export');
    }

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });
    const balance = totalIncome - totalExpense;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `transactions_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Expense Tracker Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Total Income: ${formatCurrency(totalIncome, userCurrency)}`);
    doc.text(`Total Expense: ${formatCurrency(totalExpense, userCurrency)}`);
    doc.text(`Balance: ${formatCurrency(balance, userCurrency)}`);
    doc.moveDown(2);

    // Transactions table
    doc.fontSize(14).text('Transactions', { underline: true });
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Date', 50, tableTop);
    doc.text('Title', 120, tableTop);
    doc.text('Type', 250, tableTop);
    doc.text('Category', 300, tableTop);
    doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });

    // Table rows
    let y = tableTop + 20;
    doc.font('Helvetica');
    transactions.forEach((transaction, index) => {
      if (y > 700) {
        // New page
        doc.addPage();
        y = 50;
        // Redraw header
        doc.font('Helvetica-Bold');
        doc.text('Date', 50, y);
        doc.text('Title', 120, y);
        doc.text('Type', 250, y);
        doc.text('Category', 300, y);
        doc.text('Amount', 450, y, { width: 100, align: 'right' });
        y += 20;
        doc.font('Helvetica');
      }

      const date = new Date(transaction.date).toLocaleDateString('en-IN');
      const amount = formatCurrency(transaction.amount, transaction.currency || userCurrency);

      doc.fontSize(8).text(date, 50, y);
      doc.text(transaction.title.substring(0, 20), 120, y);
      doc.text(transaction.type, 250, y);
      doc.text(transaction.category.substring(0, 15), 300, y);
      doc.text(amount, 450, y, { width: 100, align: 'right' });

      y += 15;
    });

    doc.end();
  } catch (error) {
    logger.error('PDF export error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

// @route   POST /api/export/import
// @desc    Import transactions from CSV
// @access  Private
router.post('/import', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return sendErrorResponse(res, 400, 'Invalid transactions data');
    }

    // Limit import size
    if (transactions.length > 1000) {
      return sendErrorResponse(res, 400, 'Cannot import more than 1000 transactions at once');
    }

    const results = {
      success: [],
      errors: [],
      duplicates: [],
    };

    // Track duplicates by title, amount, date, and type
    const seenTransactions = new Set();

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      try {
        // Validate required fields
        if (!t.title || !t.amount || !t.type || !t.category || !t.date) {
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields',
            data: t,
          });
          continue;
        }

        // Validate type
        if (!['income', 'expense'].includes(t.type)) {
          results.errors.push({
            row: i + 1,
            error: 'Invalid type. Must be income or expense',
            data: t,
          });
          continue;
        }

        // Validate amount
        const amount = parseFloat(t.amount);
        if (isNaN(amount) || amount < 0 || amount > 999999999) {
          results.errors.push({
            row: i + 1,
            error: 'Invalid amount (must be between 0 and 999,999,999)',
            data: t,
          });
          continue;
        }

        // Check for duplicates
        const transactionKey = `${t.title.trim().toLowerCase()}_${amount}_${t.type}_${new Date(t.date).toISOString().split('T')[0]}`;
        if (seenTransactions.has(transactionKey)) {
          results.duplicates.push({
            row: i + 1,
            error: 'Duplicate transaction',
            data: t,
          });
          continue;
        }

        // Check if transaction already exists in database
        // Use a more flexible date comparison (same day, not exact timestamp)
        const transactionDate = new Date(t.date);
        const startOfDay = new Date(transactionDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(transactionDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingTransaction = await Transaction.findOne({
          createdBy: req.user._id,
          title: t.title.trim(),
          amount: amount,
          type: t.type,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        if (existingTransaction) {
          results.duplicates.push({
            row: i + 1,
            error: 'Transaction already exists in database',
            data: t,
          });
          continue;
        }

        seenTransactions.add(transactionKey);

        // Create transaction
        const transaction = await Transaction.create({
          title: t.title.trim(),
          amount,
          type: t.type,
          category: t.category.trim(),
          date: new Date(t.date),
          recurring: t.recurring === 'Yes' || t.recurring === true || t.recurring === 'true',
          note: (t.note || '').substring(0, 1000), // Limit note length
          createdBy: req.user._id,
        });

        results.success.push(transaction);
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message,
          data: t,
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.success.length} transactions. ${results.errors.length} errors. ${results.duplicates.length} duplicates skipped.`,
      data: results,
    });
  } catch (error) {
    logger.error('Import error:', error);
    return sendErrorResponse(res, 500, 'Server error. Please try again later.');
  }
});

module.exports = router;

