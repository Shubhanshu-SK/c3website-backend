const Event = require('../models/Event');
const { toStorageFormat } = require('../utils/formatHelper');

// Category fields that must be underscore-converted before saving
const toStorage = (body) => {
  const out = { ...body };
  if (out.domain)    out.domain    = toStorageFormat(out.domain);
  if (out.presenter) out.presenter = toStorageFormat(out.presenter);
  return out;
};

const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1, date: -1 });
    const payload = events.map((event) => {
      const obj = event.toObject({ virtuals: true });
      obj.id = obj._id;
      return obj;
    });
    res.json(payload);
  } catch (err) {
    console.error('Error in getEvents:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    const obj = event.toObject({ virtuals: true });
    obj.id = obj._id;
    res.json(obj);
  } catch (err) {
    console.error('Error in getEventById:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve event.' });
  }
};

const createEvent = async (req, res) => {
  try {
    const payload = toStorage(req.body);
    const event = await Event.create(payload);
    res.status(201).json(event);
  } catch (err) {
    console.error('Error in createEvent:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to create event.' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const payload = toStorage(req.body);
    const event = await Event.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json(event);
  } catch (err) {
    console.error('Error in updateEvent:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update event.' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    console.error('Error in deleteEvent:', err);
    res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
