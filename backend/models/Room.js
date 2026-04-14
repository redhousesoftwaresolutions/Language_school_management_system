const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true },
  capacity: { type: Number },
  type:     { type: String, enum: ['Classroom', 'Lab', 'Meeting Room', 'Hall', 'Other'], default: 'Classroom' },
  notes:    { type: String },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
