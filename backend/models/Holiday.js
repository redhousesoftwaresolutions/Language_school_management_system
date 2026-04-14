const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },   // same as startDate for single-day
  note:       { type: String },
  allClasses: { type: Boolean, default: true }, // if false, only listed entries are cancelled
  entries:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimetableEntry' }],
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
