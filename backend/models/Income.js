const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  reference: { type: String, unique: true },
  source: { type: String, required: true },
  category: { type: String, enum: ['Tuition', 'Accommodation', 'Admin Fee', 'Other'], default: 'Tuition' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ['Bank Transfer', 'Card', 'Cash'], default: 'Bank Transfer' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Income', incomeSchema);
