const Accommodation = require('../models/Accommodation');
const fs   = require('fs');
const path = require('path');

const populate = { path: 'students', select: 'firstName lastName email studentId' };

// GET /api/admin/accommodation
const getAccommodations = async (req, res) => {
  try {
    const { search, type } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { propertyName: { $regex: search, $options: 'i' } },
        { address:      { $regex: search, $options: 'i' } },
        { city:         { $regex: search, $options: 'i' } },
        { postcode:     { $regex: search, $options: 'i' } },
        { landlordName: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.roomType = { $regex: type, $options: 'i' };

    const accommodations = await Accommodation.find(query)
      .populate(populate)
      .sort({ createdAt: -1 });

    res.json(accommodations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/admin/accommodation/:id
const getAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id).populate(populate);
    if (!accommodation) return res.status(404).json({ message: 'Accommodation not found' });
    res.json(accommodation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/admin/accommodation
const createAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.create(req.body);
    const populated = await Accommodation.findById(accommodation._id).populate(populate);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/admin/accommodation/:id
const updateAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(populate);
    if (!accommodation) return res.status(404).json({ message: 'Accommodation not found' });
    res.json(accommodation);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/admin/accommodation/:id
const deleteAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndDelete(req.params.id);
    if (!accommodation) return res.status(404).json({ message: 'Accommodation not found' });
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const uploadAccommodationImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const exists = await Accommodation.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: 'Accommodation not found' });
    const acc = await Accommodation.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { filename: req.file.filename, originalName: req.file.originalname } } },
      { new: true }
    ).populate(populate);
    res.json(acc);
  } catch (err) { res.status(500).json({ message: 'Upload failed', error: err.message }); }
};

const deleteAccommodationImage = async (req, res) => {
  try {
    const acc = await Accommodation.findById(req.params.id, 'images');
    if (!acc) return res.status(404).json({ message: 'Accommodation not found' });
    const img = acc.images.id(req.params.imgId);
    if (!img) return res.status(404).json({ message: 'Image not found' });
    const filePath = path.join(__dirname, '../uploads/accommodation', img.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const updated = await Accommodation.findByIdAndUpdate(
      req.params.id, { $pull: { images: { _id: req.params.imgId } } }, { new: true }
    ).populate(populate);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: 'Delete failed', error: err.message }); }
};

module.exports = { getAccommodations, getAccommodation, createAccommodation, updateAccommodation, deleteAccommodation, uploadAccommodationImage, deleteAccommodationImage };
