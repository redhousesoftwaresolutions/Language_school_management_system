const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const modelByRole = { admin: Admin, teacher: Teacher, student: Student };

// POST /api/auth/register
const register = async (req, res) => {
  const { role, firstName, lastName, email, password } = req.body;
  const Model = modelByRole[role];
  if (!Model) return res.status(400).json({ message: 'Invalid role' });

  try {
    const exists = await Model.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await Model.create({ firstName, lastName, email, password: hashed });
    res.status(201).json({ token: generateToken(user._id, role), role, id: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { role, email, password } = req.body;
  const Model = modelByRole[role];
  if (!Model) return res.status(400).json({ message: 'Invalid role' });

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: generateToken(user._id, role), role, id: user._id, firstName: user.firstName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login };
