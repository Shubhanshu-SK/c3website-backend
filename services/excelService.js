/**
 * excelService.js
 *
 * Centralised Excel (XLSX) helpers for registration data.
 * All controller functions that read/write registrations.xlsx
 * should go through this service.
 */

const path = require('path');
const fs   = require('fs');
const XLSX = require('xlsx');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const EXCEL_PATH = path.join(DATA_DIR, 'registrations.xlsx');

const HEADERS = [
  'Full_Name', 'Email', 'Enrollment_No', 'Phone_Number',
  'Institute', 'Branch', 'Source', 'Event_ID', 'Registration_Date',
];

// ── Internal helpers ─────────────────────────────────────────────

/**
 * Ensure the data directory and Excel workbook exist.
 * Returns the loaded XLSX workbook.
 */
const getWorkbook = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(EXCEL_PATH)) {
    return XLSX.readFile(EXCEL_PATH);
  }
  return XLSX.utils.book_new();
};

const saveWorkbook = (wb) => XLSX.writeFile(wb, EXCEL_PATH);

/** Safe sheet name: MongoDB ObjectIds are 24 hex chars — valid sheet names ≤ 31 chars */
const sheetName = (eventId) => String(eventId).slice(0, 31);

/**
 * Get or create a worksheet for the given eventId.
 * Returns { wb, ws, rows, sn }.
 */
const getSheet = (wb, eventId) => {
  const sn = sheetName(eventId);
  if (wb.SheetNames.includes(sn)) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return { wb, ws, rows, sn };
  }
  const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
  XLSX.utils.book_append_sheet(wb, ws, sn);
  return { wb, ws, rows: [], sn };
};

// ── Public API ───────────────────────────────────────────────────

/**
 * Check whether a registration already exists for the given
 * enrollment number + event combination.
 */
const isDuplicateRegistration = (eventId, enrollmentNo) => {
  if (!fs.existsSync(EXCEL_PATH)) return false;
  const wb = XLSX.readFile(EXCEL_PATH);
  const sn = sheetName(eventId);
  if (!wb.SheetNames.includes(sn)) return false;
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '' });
  const normalised = String(enrollmentNo).trim().toUpperCase();
  return rows.some((r) => String(r.Enrollment_No).trim().toUpperCase() === normalised);
};

/**
 * Append a new registration row to the event's sheet.
 * Creates the sheet (and workbook / data dir) if needed.
 */
const appendRegistration = (eventId, rowData) => {
  const wb = getWorkbook();
  const { sn } = getSheet(wb, eventId);
  const ws = wb.Sheets[sn];
  XLSX.utils.sheet_add_json(ws, [rowData], { skipHeader: true, origin: -1 });
  saveWorkbook(wb);
};

/**
 * Read all rows from a specific event's sheet.
 * Returns [] if the file or sheet does not exist.
 */
const getSheetRows = (eventId) => {
  if (!fs.existsSync(EXCEL_PATH)) return [];
  const wb = XLSX.readFile(EXCEL_PATH);
  const sn = sheetName(eventId);
  if (!wb.SheetNames.includes(sn)) return [];
  return XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '' });
};

/**
 * Read all sheets. Returns array of { eventId, count, registrations }.
 */
const getAllSheets = () => {
  if (!fs.existsSync(EXCEL_PATH)) return [];
  const wb = XLSX.readFile(EXCEL_PATH);
  return wb.SheetNames.map((sn) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '' });
    return { eventId: sn, count: rows.length, registrations: rows };
  });
};

/**
 * Delete a single registration row by enrollmentNo from the event's sheet.
 * Returns true if a row was deleted, false if not found.
 */
const deleteRegistration = (eventId, enrollmentNo) => {
  if (!fs.existsSync(EXCEL_PATH)) return false;
  const wb = XLSX.readFile(EXCEL_PATH);
  const sn = sheetName(eventId);
  if (!wb.SheetNames.includes(sn)) return false;
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '' });
  const normalised = String(enrollmentNo).trim().toUpperCase();
  const filtered = rows.filter(
    (r) => String(r.Enrollment_No).trim().toUpperCase() !== normalised
  );
  if (filtered.length === rows.length) return false;
  const newWs = XLSX.utils.aoa_to_sheet([HEADERS]);
  if (filtered.length > 0) {
    XLSX.utils.sheet_add_json(newWs, filtered, { skipHeader: true, origin: -1 });
  }
  wb.Sheets[sn] = newWs;
  saveWorkbook(wb);
  return true;
};

/**
 * Delete ALL registrations for an event by removing its sheet.
 * The Excel file itself is preserved; only the event's sheet is removed.
 */
const deleteEventSheet = (eventId) => {
  if (!fs.existsSync(EXCEL_PATH)) return; // nothing to do
  const wb = XLSX.readFile(EXCEL_PATH);
  const sn = sheetName(eventId);
  if (!wb.SheetNames.includes(sn)) return; // sheet doesn't exist, nothing to do
  // Remove from SheetNames and Sheets map
  wb.SheetNames = wb.SheetNames.filter((n) => n !== sn);
  delete wb.Sheets[sn];
  saveWorkbook(wb);
};

/**
 * Return the path to the XLSX file for streaming / download.
 */
const getExcelPath = () => EXCEL_PATH;

/**
 * Return the HEADERS array (used when generating an empty workbook).
 */
const getHeaders = () => HEADERS;

module.exports = {
  isDuplicateRegistration,
  appendRegistration,
  getSheetRows,
  getAllSheets,
  deleteRegistration,
  deleteEventSheet,
  getExcelPath,
  getHeaders,
};
