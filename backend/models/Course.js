const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  level: { type: String },
  teacher:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  days: [{ type: String }],
  startDate: { type: Date },
  endDate: { type: Date },
  startTime: { type: String },
  endTime: { type: String },
  price: { type: Number },
  maxStudents: { type: Number },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
