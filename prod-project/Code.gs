// =============================================================================
// AI-AGENTS PROD — NEXUS COMMAND HUB
// Account: chebert4@ebrschools.org
// Sheet: https://docs.google.com/spreadsheets/d/1qEZUBf4A1djNF5CstRxJa2UQbQqCnIZqavSF8mkKUpU
// =============================================================================

const VALID_SUBJECTS = ["Math", "Sci", "SS"];
const VALID_ANNOTATIONS = ["Doc", "Pres", "Wks", "Assess", "Guide", "Annot"];
const SHEET_NAME = "File Ops";
const SPREADSHEET_ID = "1qEZUBf4A1djNF5CstRxJa2UQbQqCnIZqavSF8mkKUpU";

// =============================================================================
// ACCOUNT GUARD — prevents wrong-account execution
// =============================================================================

function checkAccount() {
  const expected = 'chebert4@ebrschools.org';
  const actual = Session.getActiveUser().getEmail();
  if (actual !== expected) {
    throw new Error(`Wrong account! Expected ${expected}, got ${actual}`);
  }
  return true;
}

// =============================================================================
// WEBHOOK ENTRY POINTS
// =============================================================================

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    environment: 'production',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    logSecurityEvent('WEBHOOK_RECEIVED', {
      timestamp: new Date().toISOString(),
      contentType: e?.contentType || 'unknown',
      postData: e?.postData ? 'present' : 'missing'
    });

    if (!e?.postData?.contents) {
      return buildResponse(400, "Empty request body");
    }

    const payload = JSON.parse(e.postData.contents);
    const fileName = payload.fileName || "";
    const subjectCode = payload.subjectCode || "";
    const status = payload.status || "";

    if (!fileName || !subjectCode || !status) {
      return buildResponse(400, "Missing required fields: fileName, subjectCode, status");
    }

    const validation = validateFileName(fileName);
    const sheet = getOrCreateSheet(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      fileName,
      subjectCode,
      status,
      validation.valid ? "PASS" : "FAIL",
      validation.errors.join("; ")
    ]);

    if (!validation.valid) {
      return buildResponse(200, "Logged with validation errors", validation.errors);
    }

    return buildResponse(200, "Logged successfully");

  } catch (err) {
    logSecurityEvent('WEBHOOK_ERROR', { error: err.message });
    return buildResponse(500, "Server error: " + err.message);
  }
}

// =============================================================================
// INVENTORY UPDATE LOGIC
// =============================================================================

function updateInventory() {
  checkAccount();
  try {
    const folderId = getScriptProperty('DRIVE_FOLDER_ID');
    if (!folderId) {
      throw new Error('DRIVE_FOLDER_ID not set in Script Properties');
    }

    const folder = DriveApp.getFolderById(folderId);
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Inventory') || createInventorySheet();

    logSecurityEvent('INVENTORY_UPDATE_START', { folderId: folderId });

    const existingData = sheet.getDataRange().getValues();
    if (existingData.length === 0) {
      throw new Error('Inventory sheet is empty - run createInventorySheet first');
    }

    const headers = existingData[0];
    const idCol = headers.indexOf('ID');
    if (idCol === -1) {
      throw new Error('Inventory sheet missing "ID" header column');
    }

    const existingIds = existingData.slice(1).map(row => row[idCol]).filter(id => id);

    const activeFolders = folder.getFoldersByName('active');
    if (activeFolders.hasNext()) {
      scanFolder(activeFolders.next(), 'Active', sheet, existingIds);
    }

    const deprecatedCount = flagDeprecated(sheet);
    logSecurityEvent('INVENTORY_UPDATE_COMPLETE', { deprecatedCount: deprecatedCount });

  } catch (error) {
    logSecurityEvent('INVENTORY_UPDATE_ERROR', { error: error.message });
    throw error;
  }
}

function scanFolder(folder, status, sheet, existingIds) {
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const id = subfolder.getId();
    const ecosystem = detectEcosystem(subfolder);

    if (existingIds.includes(id)) {
      updateRow(sheet, id, { 'Last Updated': new Date(), 'Status': status });
    } else {
      sheet.appendRow([
        id,
        subfolder.getName(),
        ecosystem,
        status,
        '',
        subfolder.getUrl(),
        'None',
        new Date()
      ]);
    }
  }
}

// =============================================================================
// VALIDATION & HELPERS
// =============================================================================

function validateFileName(fileName) {
  const errors = [];

  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    errors.push("Missing file extension");
    return { valid: false, errors: errors };
  }

  const ext = fileName.substring(dotIndex + 1).toLowerCase();
  if (ext !== "pdf") {
    errors.push("Expected .pdf, got ." + ext);
  }

  const base = fileName.substring(0, dotIndex);
  const parts = base.split("_");
  if (parts.length !== 4) {
    errors.push(`Expected 4 underscore segments, got ${parts.length}: ${base}`);
  }

  return { valid: errors.length === 0, errors: errors };
}

function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["Timestamp", "File Name", "Subject Code", "Status", "Validation", "Errors"]);
  }
  return sheet;
}

function buildResponse(code, message, errors) {
  return ContentService
    .createTextOutput(JSON.stringify({ code: code, message: message, errors: errors || [] }))
    .setMimeType(ContentService.MimeType.JSON);
}

function detectEcosystem(folder) {
  const files = folder.getFiles();
  let hasShortcut = false, hasGS = false;

  while (files.hasNext()) {
    const file = files.next();
    const mimeType = file.getMimeType();
    const nameLower = file.getName().toLowerCase();

    if (mimeType === 'application/vnd.google-apps.shortcut') hasShortcut = true;
    if (nameLower.endsWith('.gs') || nameLower.endsWith('.js')) hasGS = true;
  }

  if (hasShortcut && hasGS) return 'Hybrid';
  if (hasShortcut) return 'iOS';
  if (hasGS) return 'Apps Script';
  return 'Unknown';
}

function updateRow(sheet, id, updates) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('ID');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(value);
      }
      return;
    }
  }
}

function flagDeprecated(sheet) {
  const config = getEnvironmentConfig();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusCol = headers.indexOf('Status');
  const updatedCol = headers.indexOf('Last Updated');

  if (statusCol === -1 || updatedCol === -1) {
    console.warn('flagDeprecated: Missing required columns Status or Last Updated');
    return 0;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (config.deprecatedDays || 30));

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const rowStatus = data[i][statusCol];
    const rowUpdated = new Date(data[i][updatedCol]);
    if (rowStatus === 'Active' && !isNaN(rowUpdated.getTime()) && rowUpdated < cutoff) {
      sheet.getRange(i + 1, statusCol + 1).setValue('Deprecated');
      count++;
    }
  }
  return count;
}

// =============================================================================
// CORE UTILITIES
// =============================================================================

function logSecurityEvent(eventType, payload) {
  console.log(`[SECURITY ${eventType}]`, JSON.stringify(payload));
}

function getScriptProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function createInventorySheet() {
  const ss = getSpreadsheet();
  const sheet = ss.insertSheet('Inventory');
  sheet.appendRow(['ID', 'Name', 'Ecosystem', 'Status', 'Last Updated', 'URL', 'Notes']);
  return sheet;
}

function getEnvironmentConfig() {
  return { deprecatedDays: 30 };
}

// =============================================================================
// TEST FUNCTION — run this in Apps Script editor to verify setup
// =============================================================================

function testSetup() {
  checkAccount();
  const ss = getSpreadsheet();
  Logger.log('Connected to sheet: ' + ss.getName());
  Logger.log('Setup complete!');
}
