// =============================================================================
// Code.gs — Gateway-OS Inventory Management (PRODUCTION)
// =============================================================================
// Handles Drive folder scanning, inventory tracking, and deprecation flagging.
// Webhook entry points have moved to Router.gs.
// Shared helpers have moved to Utilities.gs.
// Constants have moved to Config.gs.
// =============================================================================

/**
 * Scan the configured Drive folder and update the Inventory sheet.
 * Run manually or on a time-based trigger.
 */
function updateInventory() {
  checkAccount();
  try {
    const folderId = getScriptProperty('DRIVE_FOLDER_ID');
    if (!folderId) throw new Error('DRIVE_FOLDER_ID not set in Script Properties.');

    const folder = DriveApp.getFolderById(folderId);
    const sheet  = getOrCreateSheet('Inventory', [
      'ID', 'Name', 'Ecosystem', 'Status', 'Last Updated', 'URL', 'Notes'
    ]);

    logEvent('INVENTORY_UPDATE_START', { folderId });

    const existingData = sheet.getDataRange().getValues();
    const headers      = existingData[0];
    const idCol        = headers.indexOf('ID');
    if (idCol === -1) throw new Error('Inventory sheet missing "ID" header.');

    const existingIds = existingData.slice(1).map(row => row[idCol]).filter(Boolean);

    const activeFolders = folder.getFoldersByName('active');
    if (activeFolders.hasNext()) {
      _scanFolder(activeFolders.next(), 'Active', sheet, existingIds);
    }

    const deprecatedCount = _flagDeprecated(sheet);
    logEvent('INVENTORY_UPDATE_COMPLETE', { deprecatedCount });

  } catch (err) {
    logEvent('INVENTORY_UPDATE_ERROR', { error: err.message });
    throw err;
  }
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

function _scanFolder(folder, status, sheet, existingIds) {
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const id        = subfolder.getId();
    const ecosystem = _detectEcosystem(subfolder);

    if (existingIds.includes(id)) {
      _updateRow(sheet, id, { 'Last Updated': new Date(), 'Status': status });
    } else {
      sheet.appendRow([
        id,
        subfolder.getName(),
        ecosystem,
        status,
        new Date(),
        subfolder.getUrl(),
        ''
      ]);
    }
  }
}

function _detectEcosystem(folder) {
  const files = folder.getFiles();
  let hasShortcut = false, hasGS = false;

  while (files.hasNext()) {
    const file      = files.next();
    const mimeType  = file.getMimeType();
    const nameLower = file.getName().toLowerCase();

    if (mimeType === 'application/vnd.google-apps.shortcut') hasShortcut = true;
    if (nameLower.endsWith('.gs') || nameLower.endsWith('.js')) hasGS = true;
  }

  if (hasShortcut && hasGS) return 'Hybrid';
  if (hasShortcut)          return 'iOS';
  if (hasGS)                return 'Apps Script';
  return 'Unknown';
}

function _updateRow(sheet, id, updates) {
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('ID');

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

function _flagDeprecated(sheet) {
  const data       = sheet.getDataRange().getValues();
  const headers    = data[0];
  const statusCol  = headers.indexOf('Status');
  const updatedCol = headers.indexOf('Last Updated');

  if (statusCol === -1 || updatedCol === -1) {
    console.warn('_flagDeprecated: Missing required columns.');
    return 0;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEPRECATED_DAYS);

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const rowStatus  = data[i][statusCol];
    const rowUpdated = new Date(data[i][updatedCol]);
    if (rowStatus === 'Active' && !isNaN(rowUpdated.getTime()) && rowUpdated < cutoff) {
      sheet.getRange(i + 1, statusCol + 1).setValue('Deprecated');
      count++;
    }
  }
  return count;
}

// =============================================================================
// TEST — Run in Apps Script editor to verify setup
// =============================================================================

function testSetup() {
  checkAccount();
  const ss = getSpreadsheet();
  Logger.log('Environment : ' + ENV);
  Logger.log('Connected to: ' + ss.getName());
  Logger.log('Account     : ' + ACCOUNT);
  Logger.log('Setup OK.');
}
