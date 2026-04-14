const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  amount: { type: Number, required: true },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
