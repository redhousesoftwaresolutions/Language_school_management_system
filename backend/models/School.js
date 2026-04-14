const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  // Identity
  legalName:       { type: String },
  tradingName:     { type: String },
  email:           { type: String },
  phone:           { type: String },
  website:         { type: String },

  // Registered address
  address: {
    street:   { type: String },
    city:     { type: String },
    postcode: { type: String },
    country:  { type: String, default: 'United Kingdom' }
  },

  // UK legal
  companiesHouseNo: { type: String },
  vatRegistered:    { type: Boolean, default: false },
  vatNumber:        { type: String },
  vatRate:          { type: Number, default: 20 },
  charityNo:        { type: String },

  // Banking (shown on invoices)
  bank: {
    bankName:      { type: String },
    accountName:   { type: String },
    accountNumber: { type: String },
    sortCode:      { type: String },
    iban:          { type: String },
    swiftBic:      { type: String }
  },

  // Invoice settings
  invoice: {
    prefix:       { type: String, default: 'INV-' },
    nextNumber:   { type: Number, default: 1 },
    paymentTerms: { type: Number, default: 30 },
    lateInterest: { type: Number, default: 8 },
    footerNote:   { type: String, default: 'Thank you for your payment.' }
  },

  updatedAt: { type: Date, default: Date.now }
});

// Only ever one document — singleton
module.exports = mongoose.model('School', schoolSchema);
