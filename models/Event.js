const mongoose = require('mongoose');

// Category fields (stored as underscore_separated): presenter, domain
// Free-text fields (no character restrictions): title, description, venue
const catVal = {
  type: String,
  validate: {
    validator: (v) => !v || /^[A-Za-z0-9_,]+$/.test(v),
    message: (p) =>
      `"${p.value}" contains invalid characters for a category field. Use letters, numbers, and underscores only (spaces are auto-converted).`
  }
};

const eventSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  description:      { type: String, trim: true },
  image:            { type: String, trim: true },
  date:             { type: String, required: true },
  time:             { type: String },
  venue:            { type: String, trim: true },
  presenter:        { ...catVal, trim: true },
  status:           { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  registrationLink: { type: String, trim: true },
  domain:           { ...catVal, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
