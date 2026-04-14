const Accommodation = require('../models/Accommodation');

// @desc    Get all accommodations
// @route   GET /api/admin/accommodation
const getAccommodations = async (req, res) => {
  try {
    const { search, available, type } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { propertyName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { postcode: { $regex: search, $options: 'i' } },
        { landlordName: { $regex: search, $options: 'i' } }
      ];
    }

    if (available !== undefined) {
      query.available = available === 'true';
    }

    if (type) {
      query.roomType = { $regex: type, $options: 'i' };
    }

    const accommodations = await Accommodation.find(query)
      .populate('student', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(accommodations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single accommodation by ID
// @route   GET /api/admin/accommodation/:id
const getAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id)
      .populate('student', 'firstName lastName email phone');

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json(accommodation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a new accommodation
// @route   POST /api/admin/accommodation
const createAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.create(req.body);

    const populated = await Accommodation.findById(accommodation._id)
      .populate('student', 'firstName lastName email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update an accommodation
// @route   PUT /api/admin/accommodation/:id
const updateAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName email');

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json(accommodation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete an accommodation
// @route   DELETE /api/admin/accommodation/:id
const deleteAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndDelete(req.params.id);

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json({ message: 'Accommodation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getAccommodations,
  getAccommodation,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation
};
