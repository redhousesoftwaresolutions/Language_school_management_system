const express = require('express');
const router = express.Router();
const { protect, studentOnly } = require('../middleware/auth');

// All student routes require login + student role
router.use(protect, studentOnly);

// View own profile
router.get('/profile', (req, res) => {
  res.json({ message: 'Student profile' });
});

// View own timetable
router.get('/timetable', (req, res) => {
  res.json({ message: 'Student timetable' });
});

// View enrolled courses
router.get('/courses', (req, res) => {
  res.json({ message: 'Enrolled courses' });
});

module.exports = router;
