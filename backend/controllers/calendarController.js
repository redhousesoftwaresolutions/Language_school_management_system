const CalendarEvent = require('../models/CalendarEvent');

const getEvents = async (req, res) => {
  try {
    const { year, month } = req.query;
    const query = {};
    if (year && month !== undefined) {
      const start = new Date(year, month, 1);
      const end   = new Date(year, Number(month) + 1, 0, 23, 59, 59);
      query.date  = { $gte: start, $lte: end };
    }
    const events = await CalendarEvent.find(query).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
