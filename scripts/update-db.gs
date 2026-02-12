/**
 * AI-Agents Database Update Script
 * Scans Drive folder, updates inventory sheet, flags deprecated items
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const DB_CONFIG = {
  inventorySheetId: 'YOUR_INVENTORY_SHEET_ID',  // UPDATE THIS
  driveFolderId: 'YOUR_AI_AGENTS_FOLDER_ID',    // UPDATE THIS
  deprecatedDays: 90  // Days until auto-flag as deprecated
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Scan Drive folder and update inventory
 * Run manually or set as daily trigger
 */
function updateInventory() {
  const folder = DriveApp.getFolderById(DB_CONFIG.driveFolderId);
  const sheet = SpreadsheetApp.openById(DB_CONFIG.inventorySheetId).getSheetByName('Inventory');
  
  if (!sheet) {
    Logger.log('Error: Inventory sheet not found');
    return;
  }
  
  // Get existing data
  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  const idCol = headers.indexOf('ID');
  const existingIds = existingData.slice(1).map(row => row[idCol]);
  
  // Scan active folder
  const activeFolder = folder.getFoldersByName('active');
  if (activeFolder.hasNext()) {
    scanFolder(activeFolder.next(), 'Active', sheet, existingIds);
  }
  
  // Flag old items as deprecated
  flagDeprecated(sheet);
  
  Logger.log('Inventory update complete');
}

/**
 * Scan a folder and add/update entries
 */
function scanFolder(folder, status, sheet, existingIds) {
  const subfolders = folder.getFolders();
  
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const name = subfolder.getName();
    const id = subfolder.getId();
    
    // Determine ecosystem based on contents
    const ecosystem = detectEcosystem(subfolder);
    
    if (existingIds.includes(id)) {
      // Update existing row
      updateRow(sheet, id, {
        lastUpdated: new Date(),
        status: status
      });
    } else {
      // Add new row
      sheet.appendRow([
        id,
        name,
        ecosystem,
        status,
        '',  // Git link - manual entry
        subfolder.getUrl(),
        'None',  // PII level - manual review
        new Date()
      ]);
    }
  }
}

/**
 * Detect ecosystem based on file types
 */
function detectEcosystem(folder) {
  const files = folder.getFiles();
  let hasShortcut = false;
  let hasGS = false;
  
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName().toLowerCase();
    
    if (name.endsWith('.shortcut')) hasShortcut = true;
    if (name.endsWith('.gs') || name.endsWith('.js')) hasGS = true;
  }
  
  if (hasShortcut && hasGS) return 'Hybrid';
  if (hasShortcut) return 'iOS';
  if (hasGS) return 'Apps Script';
  return 'Unknown';
}

/**
 * Flag items not updated in X days as deprecated
 */
function flagDeprecated(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusCol = headers.indexOf('Status');
  const updatedCol = headers.indexOf('Last Updated');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DB_CONFIG.deprecatedDays);
  
  for (let i = 1; i < data.length; i++) {
    const lastUpdated = new Date(data[i][updatedCol]);
    const status = data[i][statusCol];
    
    if (status === 'Active' && lastUpdated < cutoffDate) {
      sheet.getRange(i + 1, statusCol + 1).setValue('Deprecated');
      Logger.log(`Flagged as deprecated: ${data[i][1]}`);
    }
  }
}

/**
 * Update a specific row by ID
 */
function updateRow(sheet, id, updates) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key);
        if (col >= 0) {
          sheet.getRange(i + 1, col + 1).setValue(value);
        }
      }
      break;
    }
  }
}

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

/**
 * Create the inventory sheet with headers
 * Run once during initial setup
 */
function createInventorySheet() {
  const ss = SpreadsheetApp.openById(DB_CONFIG.inventorySheetId);
  let sheet = ss.getSheetByName('Inventory');
  
  if (!sheet) {
    sheet = ss.insertSheet('Inventory');
  }
  
  // Set headers
  const headers = [
    'ID',
    'Name', 
    'Ecosystem',
    'Status',
    'Git',
    'Drive Path',
    'PII_Level',
    'Last Updated'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  Logger.log('Inventory sheet created');
}

/**
 * Set up daily trigger for inventory updates
 */
function setupDailyTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateInventory') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at 6 AM
  ScriptApp.newTrigger('updateInventory')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();
    
  Logger.log('Daily trigger set for 6 AM');
}
