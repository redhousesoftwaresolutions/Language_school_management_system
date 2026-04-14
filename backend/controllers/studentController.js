const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const fs      = require('fs');
const path    = require('path');

// @desc    Get all students
// @route   GET /api/admin/students
const getStudents = async (req, res) => {
  try {
    const { search, sort = 'createdAt', order = 'desc', filter } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (filter) {
      // filter can be used for any top-level string field e.g. ?filter=active
      // Currently kept as a general placeholder; extend as needed
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const students = await Student.find(query)
      .populate('enrolledCourses', 'name code level')
      .sort({ [sort]: sortOrder })
      .select('-password');

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/admin/students/:id
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'enrolledCourses',
        select: 'name code level startDate endDate teachers teacher',
        populate: [
          { path: 'teachers', select: 'firstName lastName _id' },
          { path: 'teacher',  select: 'firstName lastName _id' }
        ]
      })
      .select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new student
// @route   POST /api/admin/students
const createStudent = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const existingStudent = await Student.findOne({ email: rest.email });
    if (existingStudent) {
      return res.status(400).json({ message: 'A student with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({ ...rest, password: hashedPassword });

    const studentObj = student.toObject();
    delete studentObj.password;

    res.status(201).json(studentObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update a student
// @route   PUT /api/admin/students/:id
const updateStudent = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    const updateData = { ...rest };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('enrolledCourses', 'name code level')
      .select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/admin/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Upload a document for a student
// @route   POST /api/admin/students/:id/documents
const uploadStudentImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Delete old image from disk
    const existing = await Student.findById(req.params.id, 'profileImage');
    if (!existing) return res.status(404).json({ message: 'Student not found' });
    if (existing.profileImage) {
      const old = path.join(__dirname, '../uploads/profiles/students', existing.profileImage);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    const student = await Student.findByIdAndUpdate(
      req.params.id, { profileImage: req.file.filename }, { new: true }
    ).populate('enrolledCourses', 'name code level').select('-password');
    res.json(student);
  } catch (err) { res.status(500).json({ message: 'Upload failed', error: err.message }); }
};

const uploadStudentDoc = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const exists = await Student.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: 'Student not found' });
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $push: { documents: { filename: req.file.filename, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, label: req.body.label || '' } } },
      { new: true }
    ).populate('enrolledCourses', 'name code level').select('-password');
    res.json(student);
  } catch (err) { res.status(500).json({ message: 'Upload failed', error: err.message }); }
};

const deleteStudentDoc = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id, 'documents');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const doc = student.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const filePath = path.join(__dirname, '../uploads/students', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const updated = await Student.findByIdAndUpdate(
      req.params.id, { $pull: { documents: { _id: req.params.docId } } }, { new: true }
    ).populate('enrolledCourses', 'name code level').select('-password');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: 'Delete failed', error: err.message }); }
};

module.exports = {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  uploadStudentImage,
  uploadStudentDoc, deleteStudentDoc,
};
