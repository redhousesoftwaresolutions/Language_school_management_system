const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  reference:   { type: String, unique: true },
  supplier:    { type: String, required: true },
  category:    { type: String, enum: ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'IT', 'Insurance', 'Other'], default: 'Other' },
  amount:      { type: Number, required: true },
  date:        { type: Date, default: Date.now },
  method:      { type: String, enum: ['Bank Transfer', 'Card', 'Cash', 'Direct Debit'], default: 'Bank Transfer' },
  description: { type: String },
  notes:       { type: String },
  documents:   [{
    filename:     { type: String },
    originalName: { type: String },
    mimetype:     { type: String },
    size:         { type: Number },
    uploadedAt:   { type: Date, default: Date.now }
  }],
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
