# Test Data Files

## test_expenses.csv

This CSV file contains sample expense and income transactions for testing the expense tracker application.

## test_budget_expenses.csv

This CSV file contains transactions specifically designed to test budget tracking functionality. It includes expenses that match common budget categories and date ranges.

### Purpose

This file is designed to test budget tracking with the following scenarios:

1. **Healthcare Budget Testing:**
   - Budget: ₹10,000.00 (Monthly)
   - Period: December 1-31, 2025
   - Test transactions total: ₹9,700.00 (97% of budget) - approaching limit
   - Includes: Doctor visits, pharmacy, lab tests, dental, physiotherapy

2. **Food & Dining Budget Testing:**
   - Budget: ₹10,000.00 (Monthly)
   - Period: December 8, 2025 - January 8, 2026
   - Test transactions total: ₹12,050.00 (120.5% of budget) - exceeding budget
   - Includes: Groceries, restaurants, coffee shops, fast food

### Test Scenarios Covered

- **Budget Progress Tracking**: Transactions that progressively increase budget usage
- **Alert Threshold Testing**: Some transactions push budgets over the 80% alert threshold
- **Budget Exceeded**: Food & Dining expenses exceed the budget limit
- **Date Range Matching**: Transactions fall within the specified budget periods
- **Multiple Categories**: Includes other categories to ensure only matching budgets are affected

### Usage

Import this CSV file to test:
- Budget progress bars
- Alert notifications when approaching thresholds
- Budget exceeded warnings
- Budget status calculations
- Date range filtering for budgets

**Important Notes:**
- This CSV contains transactions with dates in December 2025 and January 2026
- Make sure your budgets are set up for these date ranges:
  - Healthcare: Dec 1-31, 2025
  - Food & Dining: Dec 8, 2025 - Jan 8, 2026
- If you get "duplicates skipped" messages, it means transactions with the same title, amount, type, and date already exist

## test_budget_expenses_unique.csv

This is an alternative version of the budget test CSV with **unique transaction titles** to avoid duplicate detection issues.

### Purpose

Same as `test_budget_expenses_unique.csv` but with:
- Unique transaction titles (e.g., "Healthcare Doctor Consultation Dec 2025" instead of "Doctor Visit")
- All titles include month/year identifiers to ensure uniqueness
- Use this file if you're getting duplicate detection errors with the regular budget CSV

### Why Duplicates Are Skipped

The import system detects duplicates based on:
- **Title** (exact match, case-insensitive after trimming)
- **Amount** (exact match)
- **Type** (income or expense)
- **Date** (same calendar day)

If you see "0 transactions imported, 63 duplicates skipped", it means:
1. You've already imported these transactions before, OR
2. Transactions with identical title/amount/type/date exist in your database

### Solution

To test budgets with fresh data:
1. **Use the unique CSV**: Import `test_budget_expenses_unique.csv` instead
2. **Clear existing data**: Delete the duplicate transactions from your Expenses page first
3. **Modify dates**: Change dates in the CSV to future dates that don't conflict

### Format

The CSV file uses the following columns:
- **Title**: Transaction title/description
- **Amount**: Transaction amount (numeric)
- **Type**: Either "income" or "expense"
- **Category**: Transaction category (must match one of the predefined categories)
- **Date**: Transaction date in YYYY-MM-DD format
- **Recurring**: "Yes" or "No" to indicate if the transaction is recurring
- **Note**: Optional notes/description for the transaction

### Usage

To import this test data:

1. **Via Frontend UI:**
   - Navigate to the Expenses page
   - Click the "Import CSV" button
   - Select `backend/tests/test_expenses.csv`
   - The transactions will be imported automatically

2. **Via API (for automated testing):**
   ```javascript
   // Parse CSV and send to /api/export/import endpoint
   const transactions = [
     {
       title: "Grocery Shopping",
       amount: 1250.50,
       type: "expense",
       category: "Food & Dining",
       date: "2024-01-15",
       recurring: "No",
       note: "Weekly groceries from supermarket"
     },
     // ... more transactions
   ];
   ```

### Test Data Contents

The file contains:
- **Total transactions**: ~70+ transactions
- **Date range**: January 2024 - March 2024
- **Categories covered**: All major categories including Food & Dining, Shopping, Transportation, Bills & Utilities, Entertainment, Healthcare, Education, Travel, Salary, Freelance, Investment, and Other
- **Transaction types**: Both income and expense transactions
- **Recurring transactions**: Monthly recurring items like rent, salary, subscriptions, etc.

### Notes

- The CSV format matches the export format from the application
- Headers are case-insensitive (the frontend converts them to lowercase)
- Dates must be in ISO format (YYYY-MM-DD)
- Amounts should be numeric values
- Type must be exactly "income" or "expense"
- Categories must match the predefined category list exactly (case-sensitive)

### Categories Available

- Food & Dining
- Shopping
- Transportation
- Bills & Utilities
- Entertainment
- Healthcare
- Education
- Travel
- Salary
- Freelance
- Investment
- Other

