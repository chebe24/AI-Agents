/**
 * @file      LoggerAgent.gs
 * @author    Cary Hebert
 * @created   2026-03-01
 * @version   2.0.0
 *
 * Gateway-OS Agent — handles ChatLogs and ProdLog writing for production.
 *
 * ROUTER CONTRACT
 *   Router.gs calls LoggerAgent_logEntry(payload) when payload.action === "logentry"
 *
 * EXPECTED PAYLOAD for logEntry():
 *   {
 *     "action":   "logentry",
 *     "timestamp": ISO timestamp or Date object,
 *     "date":     "YYYY-MM-DD",
 *     "platform": "Claude Code" | "ChatGPT" | etc.,
 *     "project":  "Gateway-OS" | etc.,
 *     "title":    "Conversation title",
 *     "summary":  "Brief description",
 *     "url":      "https://...",
 *     "tags":     "comma, separated, tags",
 *     "status":   "Complete" | "Follow-up" | "Archived" | "In Progress",
 *     "filename": "02-2026-03-01_Gateway_YAML_PatternRegistryV6.md" (optional, for validation)
 *   }
 */

// =============================================================================
// V6 FILENAME PATTERN (from Pattern Registry V6)
// =============================================================================

/**
 * Gateway-OS V6 filename pattern:
 * Format: NN-YYYY-MM-DD_Component_FileType_Title.ext
 * Example: 02-2026-03-01_Gateway_YAML_PatternRegistryV6.md
 */
const V6_FILENAME_PATTERN = /^\d{2}-\d{4}-\d{2}-\d{2}_[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+\.[a-z]{2,4}$/;

// =============================================================================
// PUBLIC FUNCTIONS
// =============================================================================

/**
 * Logs an entry to the ChatLogs tab with optional filename validation.
 *
 * @param {Object} payload - The log entry data
 * @returns {Object} Response with status and details
 */
function LoggerAgent_logEntry(payload) {
  try {
    _ProdLog_write("LoggerAgent", "LOG_ENTRY_START", "INFO", JSON.stringify(payload));

    // Validate required fields
    if (!payload.title) {
      throw new Error("Missing required field: title");
    }

    // Validate filename if provided
    let validationStatus = "Valid";
    let actualStatus = payload.status || "In Progress";

    if (payload.filename) {
      const isValid = V6_FILENAME_PATTERN.test(payload.filename);
      if (!isValid) {
        validationStatus = "Naming Error";
        actualStatus = "Naming Error";
        _ProdLog_write(
          "LoggerAgent",
          "FILENAME_VALIDATION_FAILED",
          "WARN",
          `Invalid filename: ${payload.filename}`
        );
      } else {
        _ProdLog_write(
          "LoggerAgent",
          "FILENAME_VALIDATION_PASSED",
          "INFO",
          `Valid filename: ${payload.filename}`
        );
      }
    }

    // Write to ChatLogs
    const result = _writeToChatLogs({
      timestamp: payload.timestamp || new Date(),
      date: payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      platform: payload.platform || "Unknown",
      project: payload.project || "Unknown",
      title: payload.title,
      summary: payload.summary || "",
      url: payload.url || "",
      tags: payload.tags || "",
      status: actualStatus
    });

    _ProdLog_write(
      "LoggerAgent",
      "LOG_ENTRY_COMPLETE",
      "INFO",
      `Row ${result.row} written to ChatLogs`
    );

    return _buildPlainResponse(200, "Entry logged to ChatLogs", {
      sheetName: result.sheetName,
      row: result.row,
      validationStatus: validationStatus,
      filename: payload.filename || null
    });

  } catch (e) {
    _ProdLog_write("LoggerAgent", "LOG_ENTRY_ERROR", "ERROR", e.message);
    return _buildPlainResponse(500, "LoggerAgent error: " + e.message);
  }
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/**
 * Build a plain response object for direct function calls.
 * Unlike buildResponse() in Utilities.gs (which returns ContentService for webhooks),
 * this returns a plain JavaScript object that can be logged and inspected.
 *
 * The Router will convert this to ContentService when called via webhook.
 *
 * @param {number} code - HTTP status code
 * @param {string} message - Response message
 * @param {Object} data - Optional data payload
 * @returns {Object} Plain response object
 */
function _buildPlainResponse(code, message, data) {
  return {
    code: code,
    message: message,
    data: data || {},
    env: ENV
  };
}

/**
 * Writes a row to the ChatLogs tab.
 * @param {Object} entry - The chat log entry data
 * @returns {{ sheetName: string, row: number }}
 */
function _writeToChatLogs(entry) {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
  let sheet = ss.getSheetByName("ChatLogs");

  // Create the tab if it doesn't exist (safety fallback)
  if (!sheet) {
    sheet = ss.insertSheet("ChatLogs");
    const headers = [
      "Timestamp", "Date", "AI Platform", "Project/Context",
      "Conversation Title", "Summary", "Chat URL", "Tags", "Status"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }

  // Append the row
  sheet.appendRow([
    entry.timestamp,
    entry.date,
    entry.platform,
    entry.project,
    entry.title,
    entry.summary,
    entry.url,
    entry.tags,
    entry.status
  ]);

  return {
    sheetName: "ChatLogs",
    row: sheet.getLastRow()
  };
}

/**
 * Writes a row to the ProdLog tab for production execution tracking.
 * @param {string} script - Script name (e.g., "LoggerAgent")
 * @param {string} eventType - Event type (e.g., "LOG_ENTRY_START")
 * @param {string} status - "INFO" | "WARN" | "ERROR"
 * @param {string} details - Additional details
 */
function _ProdLog_write(script, eventType, status, details) {
  try {
    const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    let sheet = ss.getSheetByName("ProdLog");

    // Create the tab if it doesn't exist (safety fallback)
    if (!sheet) {
      sheet = ss.insertSheet("ProdLog");
      const headers = ["Timestamp", "Script", "Event Type", "Status", "Details"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }

    // Append the row
    sheet.appendRow([
      new Date(),
      script,
      eventType,
      status,
      details
    ]);

    // Color-code by status
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, 5);
    switch (status) {
      case "WARN":
        range.setBackground("#FFF9C4"); // soft yellow
        break;
      case "ERROR":
        range.setBackground("#FFCDD2"); // soft red
        break;
      default:
        range.setBackground(null); // white
    }
  } catch (e) {
    Logger.log(`ProdLog write failed: ${e.message}`);
    // Don't throw - logging errors shouldn't break the main flow
  }
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test function to verify LoggerAgent with valid filename.
 * Run from Apps Script editor.
 */
function LoggerAgent_testValid() {
  const testPayload = {
    timestamp: "2026-03-01T18:05:00Z",
    date: "2026-03-01",
    platform: "Claude",
    project: "Gateway-OS",
    title: "Test Valid Entry",
    summary: "Testing V6 valid filename",
    url: "https://claude.ai/chat/test",
    tags: "test, validation",
    status: "Complete",
    filename: "01-2026-03-01_Gateway_GAS_TestEntry.gs"
  };

  const result = LoggerAgent_logEntry(testPayload);
  Logger.log("Valid filename test result:");
  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test function to verify LoggerAgent with invalid filename.
 * Run from Apps Script editor.
 */
function LoggerAgent_testInvalid() {
  const testPayload = {
    timestamp: "2026-03-01T18:05:00Z",
    date: "2026-03-01",
    platform: "Claude",
    project: "Gateway-OS",
    title: "Test Valid Entry",
    summary: "Testing V6 valid filename",
    url: "https://claude.ai/chat/test",
    tags: "test, validation",
    status: "Naming Error",
    filename: "bad filename no pattern.gs"
  };

  const result = LoggerAgent_logEntry(testPayload);
  Logger.log("Invalid filename test result:");
  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test function without filename validation.
 * Run from Apps Script editor.
 */
function LoggerAgent_testNoFilename() {
  const testPayload = {
    timestamp: "2026-03-01T18:05:00Z",
    date: "2026-03-01",
    platform: "Claude",
    project: "Gateway-OS",
    title: "Test Valid Entry",
    summary: "Testing V6 valid filename",
    url: "https://claude.ai/chat/test",
    tags: "test, validation",
    status: "Complete"
  };

  const result = LoggerAgent_logEntry(testPayload);
  Logger.log("No filename test result:");
  Logger.log(JSON.stringify(result, null, 2));
}
