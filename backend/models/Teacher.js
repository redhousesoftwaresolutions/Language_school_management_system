const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String },
  location: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
});

const teacherSchema = new mongoose.Schema({
  staffId:      { type: String, unique: true, sparse: true },
  profileImage: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  specialization: { type: String },
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  timetable: [timetableEntrySchema],
  documents: [{
    filename:     { type: String },
    originalName: { type: String },
    mimetype:     { type: String },
    size:         { type: Number },
    label:        { type: String },
    uploadedAt:   { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate staffId before saving
teacherSchema.pre('save', async function(next) {
  if (this.isNew && !this.staffId) {
    try {
      const count = await mongoose.model('Teacher').countDocuments();
      this.staffId = `STF-${String(count + 1).padStart(4, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);
