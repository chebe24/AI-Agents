/**
 * @file      InventoryAgent.gs
 * @author    Cary Hebert
 * @created   2026-03-07
 * @version   1.0.0
 *
 * Gateway-OS Agent — scans a Google Drive folder and maintains an
 * AI-agent inventory sheet. Flags stale entries as Deprecated.
 *
 * CONVERTED FROM: Proj_NexusAI/scripts/update-db.gs
 * Original security layer (checkAuthorization, logSecurityEvent) replaced
 * by Gateway-OS SecurityAgent + Utilities.gs patterns.
 *
 * ROUTER CONTRACT
 *   Router.gs calls InventoryAgent_init(payload) when payload.action === "inventory"
 *
 * EXPECTED PAYLOAD:
 *   {
 *     "action": "inventory"
 *   }
 *   No additional fields required — DRIVE_FOLDER_ID read from Script Properties.
 *
 * REQUIRED SCRIPT PROPERTY:
 *   DRIVE_FOLDER_ID — Google Drive folder ID containing agent subfolders
 *   (SPREADSHEET_ID is already set by Gateway-OS Config.gs)
 */

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================

/**
 * Main entry point called by Router.gs.
 * Scans the Drive folder, updates the Inventory sheet, flags deprecated items.
 *
 * @param {Object} payload - Webhook payload (action field already handled by Router)
 * @returns {Object} Plain response object (Router wraps it for HTTP)
 */
function InventoryAgent_init(payload) {
  try {
    _InventoryAgent_log("INVENTORY_START", "INFO", "InventoryAgent triggered via webhook");

    const folderId = _InventoryAgent_getFolderId();
    const folder   = DriveApp.getFolderById(folderId);
    const sheet    = _InventoryAgent_getOrCreateSheet();

    // Get IDs already in the sheet so we know what's new vs existing
    const existingIds = _InventoryAgent_getExistingIds(sheet);

    // Scan active/ subfolder
    const activeSubfolders = folder.getFoldersByName("active");
    let scannedCount = 0;

    if (activeSubfolders.hasNext()) {
      scannedCount = _InventoryAgent_scanFolder(
        activeSubfolders.next(),
        "Active",
        sheet,
        existingIds
      );
    } else {
      _InventoryAgent_log(
        "ACTIVE_FOLDER_NOT_FOUND",
        "WARN",
        `No "active" subfolder found in folder ID: ${folderId}`
      );
    }

    // Flag anything not updated recently as Deprecated
    const deprecatedCount = _InventoryAgent_flagDeprecated(sheet);

    _InventoryAgent_log(
      "INVENTORY_COMPLETE",
      "INFO",
      `Scanned: ${scannedCount} | Deprecated: ${deprecatedCount}`
    );

    return _InventoryAgent_respond(200, "Inventory updated successfully.", {
      scanned:    scannedCount,
      deprecated: deprecatedCount
    });

  } catch (err) {
    _InventoryAgent_log("INVENTORY_ERROR", "ERROR", err.message);
    return _InventoryAgent_respond(500, "InventoryAgent error: " + err.message);
  }
}

// =============================================================================
// PRIVATE — DRIVE SCANNING
// =============================================================================

/**
 * Scan a folder's subfolders and add/update rows in the Inventory sheet.
 *
 * @param {Folder}   folder      - The Drive folder to scan
 * @param {string}   status      - Status label to apply ("Active")
 * @param {Sheet}    sheet       - The Inventory sheet
 * @param {string[]} existingIds - Drive IDs already in the sheet
 * @returns {number} Count of items scanned
 */
function _InventoryAgent_scanFolder(folder, status, sheet, existingIds) {
  const subfolders = folder.getFolders();
  let count = 0;

  while (subfolders.hasNext()) {
    const sub       = subfolders.next();
    const id        = sub.getId();
    const name      = sub.getName();
    const ecosystem = _InventoryAgent_detectEcosystem(sub);

    if (existingIds.includes(id)) {
      // Update existing row's status and last-updated date
      _InventoryAgent_updateRow(sheet, id, {
        "Last Updated": new Date(),
        "Status":       status
      });
      _InventoryAgent_log("AGENT_UPDATED", "INFO", name);
    } else {
      // Append a new row
      sheet.appendRow([
        id,
        name,
        ecosystem,
        status,
        "",               // Git link — fill in manually
        sub.getUrl(),
        "None",           // PII level — review manually
        new Date()
      ]);
      _InventoryAgent_log("AGENT_ADDED", "INFO", name);
    }

    count++;
  }

  return count;
}

/**
 * Detect whether a folder contains iOS Shortcuts, Apps Script files, or both.
 *
 * @param {Folder} folder
 * @returns {string} "Hybrid" | "iOS" | "Apps Script" | "Unknown"
 */
function _InventoryAgent_detectEcosystem(folder) {
  const files = folder.getFiles();
  let hasShortcut = false;
  let hasGS       = false;

  while (files.hasNext()) {
    const name = files.next().getName().toLowerCase();
    if (name.endsWith(".shortcut"))                    hasShortcut = true;
    if (name.endsWith(".gs") || name.endsWith(".js"))  hasGS       = true;
  }

  if (hasShortcut && hasGS) return "Hybrid";
  if (hasShortcut)          return "iOS";
  if (hasGS)                return "Apps Script";
  return "Unknown";
}

/**
 * Flag rows as Deprecated if not updated within DEPRECATED_DAYS (from Config.gs).
 *
 * @param {Sheet} sheet - The Inventory sheet
 * @returns {number} Count of rows flagged
 */
function _InventoryAgent_flagDeprecated(sheet) {
  const data       = sheet.getDataRange().getValues();
  const headers    = data[0];
  const statusCol  = headers.indexOf("Status");
  const updatedCol = headers.indexOf("Last Updated");
  const cutoff     = new Date();
  cutoff.setDate(cutoff.getDate() - DEPRECATED_DAYS);

  let flagged = 0;

  for (let i = 1; i < data.length; i++) {
    const lastUpdated = new Date(data[i][updatedCol]);
    const status      = data[i][statusCol];

    if (status === "Active" && lastUpdated < cutoff) {
      sheet.getRange(i + 1, statusCol + 1).setValue("Deprecated");
      _InventoryAgent_log("AGENT_DEPRECATED", "WARN", String(data[i][1]));
      flagged++;
    }
  }

  return flagged;
}

// =============================================================================
// PRIVATE — SHEET HELPERS
// =============================================================================

/**
 * Get the Inventory sheet, creating it with headers if it doesn't exist.
 * Uses getOrCreateSheet() from Utilities.gs.
 *
 * @returns {Sheet}
 */
function _InventoryAgent_getOrCreateSheet() {
  return getOrCreateSheet("Inventory", [
    "ID", "Name", "Ecosystem", "Status", "Git", "Drive Path", "PII_Level", "Last Updated"
  ]);
}

/**
 * Read all Drive IDs already in the Inventory sheet.
 *
 * @param {Sheet} sheet
 * @returns {string[]}
 */
function _InventoryAgent_getExistingIds(sheet) {
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf("ID");
  return data.slice(1).map(row => row[idCol]);
}

/**
 * Update specific columns in the row matching the given Drive ID.
 *
 * @param {Sheet}  sheet   - The Inventory sheet
 * @param {string} id      - Drive folder ID to find
 * @param {Object} updates - { "Column Header": newValue, ... }
 */
function _InventoryAgent_updateRow(sheet, id, updates) {
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf("ID");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(value);
      }
      break;
    }
  }
}

// =============================================================================
// PRIVATE — CONFIGURATION
// =============================================================================

/**
 * Read DRIVE_FOLDER_ID from Script Properties.
 * Throws a clear error if not set — fail-safe, no silent failures.
 *
 * @returns {string}
 * @throws {Error} If property is missing
 */
function _InventoryAgent_getFolderId() {
  const id = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  if (!id) {
    throw new Error(
      "🚨 CONFIGURATION ERROR: DRIVE_FOLDER_ID not set in Script Properties.\n" +
      "Go to: Apps Script → Project Settings → Script Properties → Add DRIVE_FOLDER_ID"
    );
  }
  return id;
}

// =============================================================================
// PRIVATE — RESPONSE & LOGGING
// =============================================================================

/**
 * Build a plain response object (Router wraps it into ContentService).
 * Matches the pattern used by LoggerAgent and other Gateway-OS agents.
 *
 * @param {number} code    - HTTP-style status code
 * @param {string} message - Human-readable result
 * @param {Object} data    - Optional additional data
 * @returns {Object}
 */
function _InventoryAgent_respond(code, message, data) {
  return {
    code:    code,
    message: message,
    data:    data || {},
    env:     ENV
  };
}

/**
 * Write a ProdLog row via _ProdLog_write (lives in LoggerAgent.gs).
 * Falls back to console.log in dev if ProdLog is unavailable.
 *
 * @param {string} eventType - e.g. "INVENTORY_START"
 * @param {string} status    - "INFO" | "WARN" | "ERROR"
 * @param {string} details   - Details string
 */
function _InventoryAgent_log(eventType, status, details) {
  try {
    _ProdLog_write("InventoryAgent", eventType, status, details);
  } catch (e) {
    console.log(`[InventoryAgent | ${eventType} | ${status}] ${details}`);
  }
}

// =============================================================================
// TEST FUNCTIONS — run from Apps Script editor
// =============================================================================

/**
 * Smoke test: run a full inventory scan and log the result.
 * Safe to run — reads Drive, writes to Inventory sheet only.
 */
function InventoryAgent_test() {
  const result = InventoryAgent_init({ action: "inventory" });
  Logger.log("InventoryAgent test result:");
  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Verify DRIVE_FOLDER_ID is set and the folder is accessible.
 * Run this first before InventoryAgent_test().
 */
function InventoryAgent_testConfig() {
  try {
    const id     = _InventoryAgent_getFolderId();
    const folder = DriveApp.getFolderById(id);
    Logger.log(`✅ DRIVE_FOLDER_ID is set and accessible: ${folder.getName()}`);
  } catch (e) {
    Logger.log(`❌ Config error: ${e.message}`);
  }
}
