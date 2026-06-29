const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const {
  registerUserForEvent,
  getRegistrationsForEvent,
  getAllRegistrations,
  downloadRegistrations,
  deleteRegistrationForEvent,
  deleteAllRegistrationsForEvent,
} = require('../controllers/registrationController');

// Rate-limit public registration endpoint — max 10 registrations per IP per 15 min
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
});

// ── Public ─────────────────────────────────────────────────────
router.post('/:eventId', registrationLimiter, registerUserForEvent);

// ── Admin (protected) ──────────────────────────────────────────
// NOTE: /download/all and /admin/event/:eventId must come before /:eventId
// to avoid Express treating them as eventId params.
router.get('/download/all', protect, downloadRegistrations);
router.get('/', protect, getAllRegistrations);
router.delete('/admin/event/:eventId', protect, deleteAllRegistrationsForEvent);
router.get('/:eventId', protect, getRegistrationsForEvent);
router.delete('/:eventId/:enrollmentNo', protect, deleteRegistrationForEvent);

module.exports = router;
