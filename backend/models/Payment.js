const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentRef: { type: String, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ['Bank Transfer', 'Card', 'Cash'], default: 'Bank Transfer' },
  status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
