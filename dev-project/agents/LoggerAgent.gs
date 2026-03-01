/**
 * @file      LoggerAgent.gs
 * @author    Cary Hebert
 * @created   2026-03-01
 * @version   1.0.0
 *
 * Gateway-OS Agent — handles all "log" webhook actions.
 *
 * PURPOSE
 *   Writes structured event rows to the "System Log" tab in the
 *   AI Agents Command Hub spreadsheet. Makes all webhook activity
 *   visible in Google Sheets — no need to open the GAS editor to
 *   check what happened.
 *
 * ROUTER CONTRACT
 *   Router.gs calls LoggerAgent_init(payload) when payload.action === "log"
 *
 * EXPECTED PAYLOAD
 *   {
 *     "action":    "log",
 *     "eventType": "FILEOPS_LOGGED",       ← required
 *     "message":   "File logged OK.",      ← required
 *     "level":     "INFO" | "WARN" | "ERROR"  ← optional, defaults to INFO
 *     "data":      { ...any extra context }   ← optional
 *   }
 *
 * SHEET COLUMNS (auto-created on first run)
 *   Timestamp | Level | Event Type | Message | Data | Environment
 */

// =============================================================================
// ENTRY POINT
// =============================================================================

/**
 * Entry point called by the Router.
 * @param {Object} payload - Parsed JSON from the incoming webhook POST body.
 */
function LoggerAgent_init(payload) {
  try {
    logEvent('LOGGER_AGENT_START', { payload: JSON.stringify(payload) });

    var result = _LoggerAgent_process(payload);

    logEvent('LOGGER_AGENT_COMPLETE', { rowsWritten: 1 });
    return buildResponse(200, "Event logged to sheet.", result);

  } catch (e) {
    logEvent('LOGGER_AGENT_ERROR', { error: e.message });
    return buildResponse(500, "LoggerAgent error: " + e.message);
  }
}

// =============================================================================
// CORE LOGIC
// =============================================================================

/**
 * Validates the payload and writes one row to the System Log sheet.
 * @param {Object} payload
 * @returns {{ sheetName: string, row: number }}
 */
function _LoggerAgent_process(payload) {
  // ── Validate required fields ───────────────────────────────────────────
  var eventType = (payload.eventType || "").trim();
  var message   = (payload.message   || "").trim();

  if (!eventType) throw new Error("Missing required field: eventType");
  if (!message)   throw new Error("Missing required field: message");

  // ── Normalize optional fields ──────────────────────────────────────────
  var level = (payload.level || "INFO").toUpperCase().trim();
  var data  = payload.data ? JSON.stringify(payload.data) : "";

  // ── Write to sheet ─────────────────────────────────────────────────────
  var sheet = getOrCreateSheet(LOG_SHEET_NAME, [
    "Timestamp", "Level", "Event Type", "Message", "Data", "Environment"
  ]);

  sheet.appendRow([
    new Date(),
    level,
    eventType,
    message,
    data,
    ENV
  ]);

  var lastRow = sheet.getLastRow();
  _LoggerAgent_colorRow(sheet, lastRow, level);

  return { sheetName: LOG_SHEET_NAME, row: lastRow };
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/**
 * Color-codes the log row by level so it's easy to scan in Sheets.
 *   INFO  → white (no fill)
 *   WARN  → soft yellow
 *   ERROR → soft red
 *
 * @param {Sheet}  sheet
 * @param {number} rowIndex - 1-based row number
 * @param {string} level    - "INFO" | "WARN" | "ERROR"
 */
function _LoggerAgent_colorRow(sheet, rowIndex, level) {
  var range = sheet.getRange(rowIndex, 1, 1, 6);
  switch (level) {
    case "WARN":
      range.setBackground("#FFF9C4"); // soft yellow
      break;
    case "ERROR":
      range.setBackground("#FFCDD2"); // soft red
      break;
    default:
      range.setBackground(null); // clear / white
  }
}

// =============================================================================
// TEST — Run in Apps Script editor to verify setup
// =============================================================================

/**
 * Run this once in the GAS editor to confirm LoggerAgent is wired up correctly.
 * Check your AI Agents Command Hub sheet for a new "System Log" tab.
 */
function LoggerAgent_test() {
  LoggerAgent_init({ action: "log", eventType: "TEST_INFO",  message: "Logger test — INFO level.",  level: "INFO",  data: { source: "manual test" } });
  LoggerAgent_init({ action: "log", eventType: "TEST_WARN",  message: "Logger test — WARN level.",  level: "WARN",  data: { source: "manual test" } });
  LoggerAgent_init({ action: "log", eventType: "TEST_ERROR", message: "Logger test — ERROR level.", level: "ERROR", data: { source: "manual test" } });
  Logger.log("✅ LoggerAgent test complete. Check the System Log tab in your sheet.");
}
