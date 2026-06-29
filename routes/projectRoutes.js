const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/projectController');

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
