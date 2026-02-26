// =============================================================================
// Utilities.gs — Gateway-OS Shared Helper Functions
// =============================================================================
// Shared tools used by Router, Agents, and inventory logic.
// No business logic lives here — only reusable building blocks.
// =============================================================================

/**
 * Prevent this script from running under the wrong Google account.
 */
function checkAccount() {
  const actual = Session.getActiveUser().getEmail();
  if (actual !== ACCOUNT) {
    throw new Error(`Wrong account! Expected ${ACCOUNT}, got ${actual}`);
  }
  return true;
}

/**
 * Build a standard JSON response for doPost/doGet.
 * @param {number} code
 * @param {string} message
 * @param {Array}  errors
 */
function buildResponse(code, message, errors) {
  return ContentService
    .createTextOutput(JSON.stringify({
      code:    code,
      message: message,
      errors:  errors || [],
      env:     ENV
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Log a labeled event to the Apps Script console.
 * @param {string} eventType
 * @param {Object} payload
 */
function logEvent(eventType, payload) {
  console.log(`[${ENV.toUpperCase()} | ${eventType}]`, JSON.stringify(payload));
}

/**
 * Open the spreadsheet defined in Config.gs.
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Get or create a sheet tab by name.
 * @param {string} name
 * @param {Array}  headers
 */
function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }
  return sheet;
}

/**
 * Read a value from Script Properties.
 * @param {string} key
 */
function getScriptProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * Validate a file name against Gateway-OS naming conventions.
 * Expected format: YYYY-MM-DD_SubjectCode_AnnotationType_Title.pdf
 * @param {string} fileName
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateFileName(fileName) {
  const errors = [];

  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    errors.push("Missing file extension");
    return { valid: false, errors };
  }

  const ext = fileName.substring(dotIndex + 1).toLowerCase();
  if (ext !== "pdf") {
    errors.push(`Expected .pdf extension, got .${ext}`);
  }

  const base  = fileName.substring(0, dotIndex);
  const parts = base.split("_");
  if (parts.length !== 4) {
    errors.push(`Expected 4 underscore segments, got ${parts.length}: ${base}`);
  }

  return { valid: errors.length === 0, errors };
}
