const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId:    { type: String, unique: true, sparse: true },
  profileImage: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },

  address: {
    street: { type: String },
    city: { type: String },
    postcode: { type: String },
    country: { type: String }
  },

  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  medicalInformation: {
    conditions: { type: String },
    allergies: { type: String },
    medications: { type: String },
    notes: { type: String }
  },

  permissions: {
    photographicPermission: { type: Boolean, default: false },
    mediaPermission: { type: Boolean, default: false },
    dataProcessingConsent: { type: Boolean, default: false }
  },

  documents: [
    {
      filename:     { type: String },
      originalName: { type: String },
      mimetype:     { type: String },
      size:         { type: Number },
      label:        { type: String },
      uploadedAt:   { type: Date, default: Date.now }
    }
  ],

  timetable: [
    {
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      startTime: { type: String },
      endTime: { type: String },
      subject: { type: String },
      location: { type: String },
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
    }
  ],

  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate studentId before saving
studentSchema.pre('save', async function(next) {
  if (this.isNew && !this.studentId) {
    try {
      const count = await mongoose.model('Student').countDocuments();
      this.studentId = `STU-${String(count + 1).padStart(4, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
