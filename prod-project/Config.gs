// =============================================================================
// Config.gs — Gateway-OS PROD Environment Configuration
// Account: cary.hebert@gmail.com
// =============================================================================
// ONE PLACE for all constants. Never hardcode these in other files.
//
// 🔒 PROJECT SENTINEL COMPLIANT
//    - Zero-Code Storage: SPREADSHEET_ID retrieved from Script Properties
//    - Fail-Safe: Missing properties throw explicit errors
// =============================================================================

const ENV             = "production";
const ACCOUNT         = "cary.hebert@gmail.com";
const SHEET_NAME      = "File Ops";

/**
 * Secure getter for SPREADSHEET_ID from Script Properties.
 * NEVER hardcode this value in code.
 *
 * @returns {string} Spreadsheet ID
 * @throws {Error} If SPREADSHEET_ID not configured
 */
function getSpreadsheetId() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('🚨 CONFIGURATION ERROR: SPREADSHEET_ID not set in Script Properties');
  }
  return id;
}

/**
 * Legacy constant for backwards compatibility.
 * DEPRECATED: Use getSpreadsheetId() instead.
 * This will be removed in future versions.
 */
const SPREADSHEET_ID = getSpreadsheetId();

// File validation rules
const VALID_SUBJECTS    = ["Math", "Sci", "SS"];
const VALID_ANNOTATIONS = ["Doc", "Pres", "Wks", "Assess", "Guide", "Annot"];

// Inventory settings
const DEPRECATED_DAYS = 30;
