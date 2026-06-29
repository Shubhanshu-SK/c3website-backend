const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
