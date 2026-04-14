const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Income   = require('../models/Income');
const Expense  = require('../models/Expense');
const fs       = require('fs');
const path     = require('path');

// ─── Helper: auto-generate reference numbers ─────────────────────────────────

const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  return `INV-${String(count + 1).padStart(3, '0')}`;
};

const generatePaymentRef = async () => {
  const count = await Payment.countDocuments();
  return `PAY-${String(count + 1).padStart(3, '0')}`;
};

const generateIncomeRef = async () => {
  const count = await Income.countDocuments();
  return `INC-${String(count + 1).padStart(3, '0')}`;
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────

// @desc    Get all invoices
// @route   GET /api/admin/finance/invoices
const getInvoices = async (req, res) => {
  try {
    const { search, status, sort = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    let invoices = await Invoice.find(query)
      .populate('student', 'firstName lastName email')
      .populate('course', 'name code')
      .sort({ [sort]: sortOrder });

    // Post-populate search on student name or invoice number
    if (search) {
      const s = search.toLowerCase();
      invoices = invoices.filter((inv) => {
        const studentName = inv.student
          ? `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase()
          : '';
        const invNum = (inv.invoiceNumber || '').toLowerCase();
        return studentName.includes(s) || invNum.includes(s);
      });
    }

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new invoice
// @route   POST /api/admin/finance/invoices
const createInvoice = async (req, res) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({ ...req.body, invoiceNumber });

    const populated = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName email')
      .populate('course', 'name code');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update an invoice
// @route   PUT /api/admin/finance/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    // Prevent changing the auto-generated invoice number
    delete req.body.invoiceNumber;

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName email')
      .populate('course', 'name code');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/admin/finance/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

// @desc    Get all payments
// @route   GET /api/admin/finance/payments
const getPayments = async (req, res) => {
  try {
    const { search, status, method, sort = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (method) {
      query.method = method;
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    let payments = await Payment.find(query)
      .populate('student', 'firstName lastName email')
      .populate('invoice', 'invoiceNumber amount status')
      .sort({ [sort]: sortOrder });

    if (search) {
      const s = search.toLowerCase();
      payments = payments.filter((pay) => {
        const studentName = pay.student
          ? `${pay.student.firstName} ${pay.student.lastName}`.toLowerCase()
          : '';
        const ref = (pay.paymentRef || '').toLowerCase();
        return studentName.includes(s) || ref.includes(s);
      });
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new payment
// @route   POST /api/admin/finance/payments
const createPayment = async (req, res) => {
  try {
    const paymentRef = await generatePaymentRef();

    const payment = await Payment.create({ ...req.body, paymentRef });

    const populated = await Payment.findById(payment._id)
      .populate('student', 'firstName lastName email')
      .populate('invoice', 'invoiceNumber amount status');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update a payment
// @route   PUT /api/admin/finance/payments/:id
const updatePayment = async (req, res) => {
  try {
    // Prevent changing the auto-generated payment reference
    delete req.body.paymentRef;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName email')
      .populate('invoice', 'invoiceNumber amount status');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a payment
// @route   DELETE /api/admin/finance/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── INCOME ───────────────────────────────────────────────────────────────────

// @desc    Get all income records
// @route   GET /api/admin/finance/income
const getIncomes = async (req, res) => {
  try {
    const { search, category, method, sort = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (method) {
      query.method = method;
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    let incomes = await Income.find(query).sort({ [sort]: sortOrder });

    if (search) {
      const s = search.toLowerCase();
      incomes = incomes.filter((inc) => {
        return (
          (inc.source || '').toLowerCase().includes(s) ||
          (inc.reference || '').toLowerCase().includes(s) ||
          (inc.notes || '').toLowerCase().includes(s)
        );
      });
    }

    res.json(incomes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new income record
// @route   POST /api/admin/finance/income
const createIncome = async (req, res) => {
  try {
    const reference = await generateIncomeRef();

    const income = await Income.create({ ...req.body, reference });

    res.status(201).json(income);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update an income record
// @route   PUT /api/admin/finance/income/:id
const updateIncome = async (req, res) => {
  try {
    // Prevent changing the auto-generated reference
    delete req.body.reference;

    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    res.json(income);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete an income record
// @route   DELETE /api/admin/finance/income/:id
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    res.json({ message: 'Income record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

const generateExpenseRef = async () => {
  const count = await Expense.countDocuments();
  return `EXP-${String(count + 1).padStart(3, '0')}`;
};

const getExpenses = async (req, res) => {
  try {
    const { search, category } = req.query;
    let expenses = await Expense.find().sort({ createdAt: -1 });
    if (category) expenses = expenses.filter(e => e.category === category);
    if (search) {
      const s = search.toLowerCase();
      expenses = expenses.filter(e =>
        (e.supplier || '').toLowerCase().includes(s) ||
        (e.reference || '').toLowerCase().includes(s) ||
        (e.description || '').toLowerCase().includes(s)
      );
    }
    res.json(expenses);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

const createExpense = async (req, res) => {
  try {
    const reference = await generateExpenseRef();
    const expense = await Expense.create({ ...req.body, reference });
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

const updateExpense = async (req, res) => {
  try {
    delete req.body.reference;
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ─── Expense Documents ────────────────────────────────────────────────────────

const uploadExpenseDoc = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (!req.file)  return res.status(400).json({ message: 'No file uploaded' });

    expense.documents.push({
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
    });
    await expense.save();
    res.json(expense);
  } catch (err) { res.status(500).json({ message: 'Upload failed', error: err.message }); }
};

const deleteExpenseDoc = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const doc = expense.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Delete file from disk
    const filePath = path.join(__dirname, '../uploads/expenses', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    doc.deleteOne();
    await expense.save();
    res.json(expense);
  } catch (err) { res.status(500).json({ message: 'Delete failed', error: err.message }); }
};

module.exports = {
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getPayments, createPayment, updatePayment, deletePayment,
  getIncomes,  createIncome,  updateIncome,  deleteIncome,
  getExpenses, createExpense, updateExpense, deleteExpense,
  uploadExpenseDoc, deleteExpenseDoc,
};
