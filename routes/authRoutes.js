const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' }
});

router.post('/login', loginLimiter, loginAdmin);

module.exports = router;
