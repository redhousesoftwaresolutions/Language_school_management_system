const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const fs      = require('fs');
const path    = require('path');

// @desc    Get all teachers
// @route   GET /api/admin/staff
const getTeachers = async (req, res) => {
  try {
    const { search, sort = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const teachers = await Teacher.find(query)
      .populate('assignedCourses', 'name code level')
      .sort({ [sort]: sortOrder })
      .select('-password');

    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single teacher by ID
// @route   GET /api/admin/staff/:id
const getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('assignedCourses', 'name code level startDate endDate')
      .populate('assignedStudents', 'firstName lastName email')
      .select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new teacher
// @route   POST /api/admin/staff
const createTeacher = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const existingTeacher = await Teacher.findOne({ email: rest.email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'A teacher with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await Teacher.create({ ...rest, password: hashedPassword });

    const teacherObj = teacher.toObject();
    delete teacherObj.password;

    res.status(201).json(teacherObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update a teacher
// @route   PUT /api/admin/staff/:id
const updateTeacher = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    const updateData = { ...rest };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedCourses', 'name code level')
      .select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/admin/staff/:id
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const uploadTeacherImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const existing = await Teacher.findById(req.params.id, 'profileImage');
    if (!existing) return res.status(404).json({ message: 'Teacher not found' });
    if (existing.profileImage) {
      const old = path.join(__dirname, '../uploads/profiles/teachers', existing.profileImage);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id, { profileImage: req.file.filename }, { new: true }
    ).populate('assignedCourses', 'name code level').select('-password');
    res.json(teacher);
  } catch (err) { res.status(500).json({ message: 'Upload failed', error: err.message }); }
};

const uploadTeacherDoc = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const exists = await Teacher.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: 'Teacher not found' });
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $push: { documents: { filename: req.file.filename, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, label: req.body.label || '' } } },
      { new: true }
    ).populate('assignedCourses', 'name code level').select('-password');
    res.json(teacher);
  } catch (err) { res.status(500).json({ message: 'Upload failed', error: err.message }); }
};

const deleteTeacherDoc = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id, 'documents');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    const doc = teacher.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const filePath = path.join(__dirname, '../uploads/teachers', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const updated = await Teacher.findByIdAndUpdate(
      req.params.id, { $pull: { documents: { _id: req.params.docId } } }, { new: true }
    ).populate('assignedCourses', 'name code level').select('-password');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: 'Delete failed', error: err.message }); }
};

module.exports = {
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher,
  uploadTeacherImage,
  uploadTeacherDoc, deleteTeacherDoc,
};
