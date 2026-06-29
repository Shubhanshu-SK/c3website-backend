const fs   = require('fs');
const XLSX = require('xlsx');
const excel = require('../services/excelService');
const Event = require('../models/Event');
const emailService = require('../services/emailService');

// ── Validation helpers ────────────────────────────────────────
const NAME_RE   = /^[A-Za-z\s]+$/;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENROLL_RE = /^[A-Za-z0-9]+$/;
// Phone: 7–15 chars, digits only or with +, -, space, (), #
const PHONE_RE  = /^[0-9+()#\s-]{7,15}$/;
// Source: free text, 1–40 characters
const SOURCE_MAX = 40;

const VALID_INSTITUTES = ['UIT', 'SOIT'];
const VALID_BRANCHES = {
  UIT:  ['CSE', 'EX', 'EC', 'IT', 'MECH', 'AU'],
  SOIT: ['AI/ML', 'CS/BS', 'CS/DS'],
};

// ── Controller: Register user for event ───────────────────────
const registerUserForEvent = async (req, res) => {
  const { eventId } = req.params;
  const { fullName, email, enrollmentNo, phoneNumber, institute, branch, source } = req.body;

  // ── 1. Validate required fields ──
  if (!fullName || !email || !enrollmentNo || !phoneNumber || !institute || !branch || !source) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (!NAME_RE.test(fullName)) {
    return res.status(400).json({ success: false, message: 'Full Name must contain letters and spaces only.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  if (!ENROLL_RE.test(enrollmentNo)) {
    return res.status(400).json({ success: false, message: 'Enrollment Number must be alphanumeric only.' });
  }
  if (!PHONE_RE.test(phoneNumber.trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid phone number (7–15 digits).' });
  }
  if (!VALID_INSTITUTES.includes(institute)) {
    return res.status(400).json({ success: false, message: 'Invalid institute selected.' });
  }
  if (!VALID_BRANCHES[institute] || !VALID_BRANCHES[institute].includes(branch)) {
    return res.status(400).json({ success: false, message: 'Invalid branch for selected institute.' });
  }
  const trimmedSource = source.trim();
  if (!trimmedSource || trimmedSource.length > SOURCE_MAX) {
    return res.status(400).json({
      success: false,
      message: `Source is required and must be ${SOURCE_MAX} characters or fewer.`,
    });
  }
  if (!eventId || eventId.length < 4) {
    return res.status(400).json({ success: false, message: 'Invalid event ID.' });
  }

  try {
    // ── 2. Duplicate check: enrollmentNo + eventId ──
    const normalised = enrollmentNo.trim().toUpperCase();
    if (excel.isDuplicateRegistration(eventId, normalised)) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    // ── 3. Append new row ──
    const newRow = {
      Full_Name:         fullName.trim(),
      Email:             email.trim().toLowerCase(),
      Enrollment_No:     normalised,
      Phone_Number:      phoneNumber.trim(),
      Institute:         institute,
      Branch:            branch,
      Source:            trimmedSource,
      Event_ID:          eventId,
      Registration_Date: new Date().toISOString().split('T')[0],
    };
    excel.appendRegistration(eventId, newRow);

    // Fire email confirmation asynchronously (non-blocking)
    Event.findById(eventId)
      .then((eventData) => {
        if (eventData) {
          const studentData = {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            enrollmentNo: normalised,
            phoneNumber: phoneNumber.trim(),
            institute,
            branch,
            source: trimmedSource,
          };
          return emailService.sendRegistrationConfirmationEmail(studentData, eventData);
        } else {
          console.warn(`[RegistrationController] Event with ID ${eventId} not found in DB, skipping confirmation email.`);
        }
      })
      .catch((err) => {
        console.error('[RegistrationController] Error sending registration confirmation email:', err);
      });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! See you at the event.',
    });
  } catch (err) {
    console.error('Error in registerUserForEvent:', err);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── Controller: Get registrations for one event (admin) ───────
const getRegistrationsForEvent = async (req, res) => {
  const { eventId } = req.params;
  try {
    const rows = excel.getSheetRows(eventId);
    return res.json({ success: true, count: rows.length, registrations: rows });
  } catch (err) {
    console.error('Error in getRegistrationsForEvent:', err);
    return res.status(500).json({ success: false, message: 'Failed to load registrations.' });
  }
};

// ── Controller: Get all registrations summary (admin) ─────────
const getAllRegistrations = async (req, res) => {
  try {
    const sheets = excel.getAllSheets();
    return res.json({ success: true, sheets });
  } catch (err) {
    console.error('Error in getAllRegistrations:', err);
    return res.status(500).json({ success: false, message: 'Failed to load registrations.' });
  }
};

// ── Controller: Download Excel file (admin) ───────────────────
const downloadRegistrations = async (req, res) => {
  try {
    const excelPath = excel.getExcelPath();
    const HEADERS   = excel.getHeaders();

    if (!fs.existsSync(excelPath)) {
      // Return empty workbook if no registrations exist yet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
      XLSX.utils.book_append_sheet(wb, ws, 'No_Registrations');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buf);
    }
    const buf = fs.readFileSync(excelPath);
    res.setHeader('Content-Disposition', 'attachment; filename="c3_registrations.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (err) {
    console.error('Error in downloadRegistrations:', err);
    return res.status(500).json({ success: false, message: 'Failed to download file.' });
  }
};

// ── Controller: Delete one registration from an event sheet ───
const deleteRegistrationForEvent = async (req, res) => {
  const { eventId, enrollmentNo } = req.params;
  if (!eventId || !enrollmentNo) {
    return res.status(400).json({ success: false, message: 'eventId and enrollmentNo are required.' });
  }
  try {
    const deleted = excel.deleteRegistration(eventId, enrollmentNo);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }
    return res.json({ success: true, message: `Registration ${enrollmentNo.toUpperCase()} deleted.` });
  } catch (err) {
    console.error('Error in deleteRegistrationForEvent:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete registration.' });
  }
};

// ── Controller: Delete ALL registrations for one event (admin) ─
const deleteAllRegistrationsForEvent = async (req, res) => {
  const { eventId } = req.params;
  if (!eventId) {
    return res.status(400).json({ success: false, message: 'eventId is required.' });
  }
  try {
    excel.deleteEventSheet(eventId);
    return res.json({ success: true, message: 'All registrations for this event have been deleted.' });
  } catch (err) {
    console.error('Error in deleteAllRegistrationsForEvent:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete registrations.' });
  }
};

module.exports = {
  registerUserForEvent,
  getRegistrationsForEvent,
  getAllRegistrations,
  downloadRegistrations,
  deleteRegistrationForEvent,
  deleteAllRegistrationsForEvent,
};
