const TimetableEntry = require('../models/TimetableEntry');
const Holiday        = require('../models/Holiday');

// ── Timetable Entries ─────────────────────────────────────────────────────────

const getEntries = async (req, res) => {
  try {
    const entries = await TimetableEntry.find()
      .populate('course', 'name code startDate endDate teachers');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.create(req.body);
    const populated = await TimetableEntry.findById(entry._id)
      .populate('course', 'name code startDate endDate teachers');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('course', 'name code startDate endDate teachers');
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    // Remove this entry from any holidays that reference it
    await Holiday.updateMany(
      { entries: req.params.id },
      { $pull: { entries: req.params.id } }
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Holidays ──────────────────────────────────────────────────────────────────

const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find()
      .populate('entries', 'day time teacher room course')
      .sort({ startDate: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createHoliday = async (req, res) => {
  try {
    const { startDate, endDate, note, allClasses, entries } = req.body;
    const holiday = await Holiday.create({
      startDate,
      endDate: endDate || startDate,
      note,
      allClasses: allClasses !== false,
      entries: allClasses !== false ? [] : (entries || []),
    });
    const populated = await Holiday.findById(holiday._id)
      .populate('entries', 'day time teacher room course');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getEntries, createEntry, updateEntry, deleteEntry,
  getHolidays, createHoliday, deleteHoliday,
};
