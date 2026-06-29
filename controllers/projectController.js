const Project = require('../models/Project');
const { toStorageFormat } = require('../utils/formatHelper');

// Category fields that must be underscore-converted before saving
const toStorage = (body) => {
  const out = { ...body };
  if (out.domain) out.domain = toStorageFormat(out.domain);
  // contributors and technology arrive as arrays (split by controller or sent as arrays)
  if (out.contributors) out.contributors = toStorageFormat(out.contributors);
  if (out.technology)   out.technology   = toStorageFormat(out.technology);
  return out;
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    const payload = projects.map((project) => {
      const obj = project.toObject({ virtuals: true });
      obj.id = obj._id;
      return obj;
    });
    res.json(payload);
  } catch (err) {
    console.error('Error in getProjects:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve projects.' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    const obj = project.toObject({ virtuals: true });
    obj.id = obj._id;
    res.json(obj);
  } catch (err) {
    console.error('Error in getProjectById:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve project.' });
  }
};

const createProject = async (req, res) => {
  try {
    const payload = toStorage(req.body);
    const project = await Project.create(payload);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error in createProject:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to create project.' });
  }
};

const updateProject = async (req, res) => {
  try {
    const payload = toStorage(req.body);
    const project = await Project.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json(project);
  } catch (err) {
    console.error('Error in updateProject:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update project.' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    console.error('Error in deleteProject:', err);
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
