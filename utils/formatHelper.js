/**
 * formatHelper.js
 *
 * Shared utilities for converting between "display" format (spaces)
 * and "storage" format (underscores) for category-style fields.
 *
 * Rules:
 *  - toStorageFormat: trim + replace one or more spaces with a single underscore
 *  - toDisplayFormat: replace underscores with spaces
 *
 * These are applied only to category fields (domain, presenter,
 * contributors, technology). Free-text fields (title, description,
 * venue) pass through unchanged.
 */

/**
 * Convert a string or array of strings to storage format.
 * "Web Development" → "Web_Development"
 * @param {string|string[]} val
 * @returns {string|string[]}
 */
const toStorageFormat = (val) => {
  if (Array.isArray(val)) {
    return val.map((item) =>
      typeof item === 'string' ? item.trim().replace(/\s+/g, '_') : item
    );
  }
  if (typeof val === 'string') {
    return val.trim().replace(/\s+/g, '_');
  }
  return val;
};

/**
 * Convert a string or array of strings from storage format to display format.
 * "Web_Development" → "Web Development"
 * @param {string|string[]} val
 * @returns {string|string[]}
 */
const toDisplayFormat = (val) => {
  if (Array.isArray(val)) {
    return val.map((item) =>
      typeof item === 'string' ? item.replace(/_/g, ' ') : item
    );
  }
  if (typeof val === 'string') {
    return val.replace(/_/g, ' ');
  }
  return val;
};

module.exports = { toStorageFormat, toDisplayFormat };
