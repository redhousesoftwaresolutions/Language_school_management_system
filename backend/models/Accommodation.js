const mongoose = require('mongoose');

const accommodationSchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  postcode: { type: String },
  country: { type: String },
  roomType: { type: String },
  capacity: { type: Number },
  pricePerWeek: { type: Number },
  availableFrom: { type: Date },
  amenities: { type: String },
  description: { type: String },
  landlordName: { type: String },
  landlordPhone: { type: String },
  landlordEmail: { type: String },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Accommodation', accommodationSchema);
