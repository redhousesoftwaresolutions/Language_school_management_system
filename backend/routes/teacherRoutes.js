const express = require('express');
const router = express.Router();
const { protect, teacherOnly } = require('../middleware/auth');

// All teacher routes require login + teacher role
router.use(protect, teacherOnly);

// View own profile
router.get('/profile', (req, res) => {
  res.json({ message: 'Teacher profile' });
});

// View assigned students
router.get('/students', (req, res) => {
  res.json({ message: 'Assigned students' });
});

// View own timetable
router.get('/timetable', (req, res) => {
  res.json({ message: 'Teacher timetable' });
});

module.exports = router;
