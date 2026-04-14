const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/admin/courses
const getCourses = async (req, res) => {
  try {
    const { search, sort = 'createdAt', order = 'desc', level } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (level) {
      query.level = { $regex: level, $options: 'i' };
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const courses = await Course.find(query)
      .populate('teacher', 'firstName lastName email specialization').populate('teachers', 'firstName lastName email specialization')
      .populate('students', 'firstName lastName email')
      .sort({ [sort]: sortOrder });

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single course by ID
// @route   GET /api/admin/courses/:id
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'firstName lastName email specialization').populate('teachers', 'firstName lastName email specialization')
      .populate('students', 'firstName lastName email phone');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new course
// @route   POST /api/admin/courses
const createCourse = async (req, res) => {
  try {
    const existingCourse = await Course.findOne({ code: req.body.code });
    if (existingCourse) {
      return res.status(400).json({ message: 'A course with this code already exists' });
    }

    const course = await Course.create(req.body);

    const populated = await Course.findById(course._id)
      .populate('teacher', 'firstName lastName email specialization').populate('teachers', 'firstName lastName email specialization')
      .populate('students', 'firstName lastName email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update a course
// @route   PUT /api/admin/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('teacher', 'firstName lastName email specialization').populate('teachers', 'firstName lastName email specialization')
      .populate('students', 'firstName lastName email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a course
// @route   DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
};
