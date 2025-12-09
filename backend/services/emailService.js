const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or other services
  // For production, use a service like SendGrid, Mailgun, or AWS SES
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email
const sendEmail = async (to, subject, html, text) => {
  try {
    // Skip email sending if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not sent - SMTP not configured');
      console.log('Would send to:', to);
      console.log('Subject:', subject);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send budget alert email
const sendBudgetAlert = async (user, budget) => {
  const subject = `Budget Alert: ${budget.category}`;
  const html = `
    <h2>Budget Alert</h2>
    <p>Hello ${user.name},</p>
    <p>Your budget for <strong>${budget.category}</strong> has reached ${budget.percentageUsed.toFixed(1)}%.</p>
    <ul>
      <li>Budget: ₹${budget.amount.toLocaleString('en-IN')}</li>
      <li>Spent: ₹${budget.spent.toLocaleString('en-IN')}</li>
      <li>Remaining: ₹${budget.remaining.toLocaleString('en-IN')}</li>
    </ul>
    ${budget.isOverBudget ? '<p style="color: red;"><strong>⚠️ You have exceeded your budget!</strong></p>' : ''}
    <p>Please review your expenses to stay within budget.</p>
  `;

  return await sendEmail(user.email, subject, html);
};

// Send goal achievement email
const sendGoalAchievement = async (user, goal) => {
  const subject = `🎉 Goal Achieved: ${goal.title}`;
  const html = `
    <h2>Congratulations!</h2>
    <p>Hello ${user.name},</p>
    <p>You have successfully achieved your goal: <strong>${goal.title}</strong></p>
    <ul>
      <li>Target: ₹${goal.targetAmount.toLocaleString('en-IN')}</li>
      <li>Achieved: ₹${goal.currentAmount.toLocaleString('en-IN')}</li>
    </ul>
    <p>Keep up the great work!</p>
  `;

  return await sendEmail(user.email, subject, html);
};

// Send monthly report email
const sendMonthlyReport = async (user, reportData) => {
  const subject = `Monthly Expense Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  const html = `
    <h2>Monthly Expense Report</h2>
    <p>Hello ${user.name},</p>
    <p>Here's your expense summary for the month:</p>
    <ul>
      <li>Total Income: ₹${reportData.totalIncome.toLocaleString('en-IN')}</li>
      <li>Total Expense: ₹${reportData.totalExpense.toLocaleString('en-IN')}</li>
      <li>Balance: ₹${reportData.balance.toLocaleString('en-IN')}</li>
      <li>Transactions: ${reportData.transactionCount}</li>
    </ul>
    <p>Thank you for using Expense Tracker!</p>
  `;

  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendBudgetAlert,
  sendGoalAchievement,
  sendMonthlyReport,
};

