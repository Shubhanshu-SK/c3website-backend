/**
 * validationMiddleware.js
 *
 * General-purpose input sanitiser for the C³ API.
 *
 * NOTE: This middleware is NOT currently applied to Event/Project routes —
 * those controllers handle their own conversion via formatHelper.
 * This file is kept clean for future use on other routes.
 */

const validateInput = (req, res, next) => {
  const urlFields      = ['image', 'registrationLink', 'photo', 'github', 'linkedin', 'demo'];
  const skipFields     = ['password', 'title', 'description', 'venue']; // free-text — no regex restriction
  const errors         = [];

  const checkValue = (key, val) => {
    if (val === undefined || val === null || val === '') return;
    if (skipFields.includes(key)) return;

    if (urlFields.includes(key)) {
      if (val !== '#') {
        const urlRegex = /^https?:\/\/[A-Za-z0-9_\-\.\/?=&%#+]+$/;
        if (!urlRegex.test(val)) {
          errors.push(`${key} must be a valid URL starting with http:// or https://.`);
        }
      }
      return;
    }

    if (key === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        errors.push(`date must be in YYYY-MM-DD format.`);
      }
      return;
    }

    if (key === 'time') {
      if (!/^\d{2}:\d{2}$/.test(val)) {
        errors.push(`time must be in HH:MM format.`);
      }
      return;
    }

    if (key === 'domain') {
      // Domains are stored with underscores; all 8 C³ domains
      const allowedDomains = [
        'Tech_Team',
        'Web_Development',
        'DSA',
        'Data_Science',
        'Operation_and_Management',
        'PR_and_Outreach',
        'Media_and_Content_Writing',
        'Graphic_Designing',
      ];
      if (!allowedDomains.includes(val)) {
        errors.push(`domain must be one of: ${allowedDomains.join(', ')}. Found: "${val}"`);
      }
      return;
    }
  };

  if (req.body && typeof req.body === 'object') {
    Object.entries(req.body).forEach(([key, val]) => {
      checkValue(key, val);
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  next();
};

module.exports = validateInput;
