const mongoose = require('mongoose');

const accommodationSchema = new mongoose.Schema({
  propertyName:  { type: String, required: true },
  address:       { type: String },
  city:          { type: String },
  postcode:      { type: String },
  country:       { type: String },
  roomType:      { type: String },
  capacity:      { type: Number, default: 1 },
  pricePerWeek:  { type: Number },
  availableFrom: { type: Date },
  amenities:     { type: String },
  description:   { type: String },
  landlordName:  { type: String },
  landlordPhone: { type: String },
  landlordEmail: { type: String },
  images:        [{ filename: { type: String }, originalName: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
  students:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt:     { type: Date, default: Date.now }
});

// Virtual: occupied when students.length >= capacity
accommodationSchema.virtual('available').get(function () {
  return (this.students?.length || 0) < (this.capacity || 1);
});

accommodationSchema.set('toJSON',   { virtuals: true });
accommodationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Accommodation', accommodationSchema);
