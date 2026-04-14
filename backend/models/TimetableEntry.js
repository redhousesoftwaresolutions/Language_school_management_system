const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  day:     { type: String, required: true },   // 'Monday', 'Tuesday', etc.
  time:    { type: String, required: true },   // '09:00'
  teacher: { type: String },                  // denormalized full name
  room:    { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
