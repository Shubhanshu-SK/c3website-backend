const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST /api/auth/login
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Username and password are required.' });

  // Only shubhanshu03 is allowed admin access
  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(403).json({ success: false, message: 'Access denied. Unknown user.' });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, token, username: admin.username });
  } catch (err) {
    console.error('Error in loginAdmin:', err);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};

module.exports = { loginAdmin };
