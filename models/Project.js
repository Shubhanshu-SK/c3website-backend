const mongoose = require('mongoose');

// Category fields (stored as underscore_separated): domain, contributors[], technology[]
// Free-text fields (no character restrictions): title, description
const catVal = {
  type: String,
  validate: {
    validator: (v) => !v || /^[A-Za-z0-9_,]+$/.test(v),
    message: (p) =>
      `"${p.value}" contains invalid characters for a category field. Use letters, numbers, and underscores only (spaces are auto-converted).`
  }
};

const projectSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  image:        { type: String, trim: true },
  domain:       { ...catVal, trim: true },
  contributors: [{
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^[A-Za-z0-9_,]+$/.test(v),
      message: (p) => `Contributor "${p.value}" contains invalid characters.`
    }
  }],
  technology:   [{
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^[A-Za-z0-9_,]+$/.test(v),
      message: (p) => `Technology "${p.value}" contains invalid characters.`
    }
  }],
  github:       { type: String, trim: true },
  demo:         { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
