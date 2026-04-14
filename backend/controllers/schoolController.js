const School = require('../models/School');

// GET /api/admin/school
const getSchool = async (req, res) => {
  try {
    let school = await School.findOne();
    if (!school) {
      school = await School.create({});
    }
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/admin/school
const updateSchool = async (req, res) => {
  try {
    let school = await School.findOne();
    if (!school) {
      school = new School();
    }
    Object.assign(school, req.body);
    school.updatedAt = new Date();
    await school.save();
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getSchool, updateSchool };
