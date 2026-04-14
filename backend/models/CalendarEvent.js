const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  date:        { type: Date, required: true },
  endDate:     { type: Date },
  startTime:   { type: String },
  endTime:     { type: String },
  location:    { type: String },
  description: { type: String },
  color:       { type: String, default: '#4A90D9' },
  allDay:      { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
