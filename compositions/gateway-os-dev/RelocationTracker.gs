/**
 * @Gem: RelocationTracker
 * @Created: 2026-02-25
 * @Author: cary.hebert@gmail.com (DEV)
 * @Status: Development
 * @Description: Tracks SHSID onboarding documents in Google Sheet.
 *               No service account or credentials file needed —
 *               SpreadsheetApp handles auth automatically.
 *
 * SETUP (one-time, before running):
 *   In the Apps Script editor → Project Settings → Script Properties → Add:
 *     Key:   RELOCATION_SHEET_ID
 *     Value: (paste the Sheet ID from your Google Sheet URL)
 *
 * DEPLOY FLOW:
 *   1. Edit and test here in dev-project/
 *   2. Run: ./ai-agents.sh deploy dev
 *   3. Test in Apps Script editor
 *   4. Run: ./ai-agents.sh deploy prod (after confirmation)
 */

// ── CONFIG ─────────────────────────────────────────────────────────────────
// Sheet ID is stored in Script Properties, never hardcoded here.
// In Apps Script editor: Project Settings → Script Properties → Add:
//   Key: RELOCATION_SHEET_ID
//   Value: (paste your Sheet ID from the URL)

function RelocationTracker_init() {
  const sheetId = PropertiesService.getScriptProperties()
                    .getProperty('RELOCATION_SHEET_ID');

  if (!sheetId) {
    console.error('❌ RELOCATION_SHEET_ID not set in Script Properties.');
    return;
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Documents')
                || ss.insertSheet('Documents');

  // Set up headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Filename', 'Status', 'Review Status', 'Date Added', 'Notes'
    ]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    console.log('✅ Headers created on Documents sheet.');
  } else {
    console.log('✅ Documents sheet already initialized.');
  }
}

/**
 * Log a document manually (call from Apps Script editor or trigger).
 * @param {string} filename - Name of the document
 * @param {string} status - e.g. "Uploaded", "Pending", "Approved"
 * @param {string} notes - Optional notes
 */
function logDocument(filename, status, notes) {
  const sheetId = PropertiesService.getScriptProperties()
                    .getProperty('RELOCATION_SHEET_ID');

  if (!sheetId) {
    console.error('❌ RELOCATION_SHEET_ID not set in Script Properties.');
    return;
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Documents');

  if (!sheet) {
    console.error('❌ Documents sheet not found. Run RelocationTracker_init() first.');
    return;
  }

  // Check for duplicate before adding
  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => row[0] === filename);

  if (exists) {
    console.log('⚠️ Already logged: ' + filename);
    return;
  }

  sheet.appendRow([
    filename,
    status || 'Pending',
    'Pending Review',
    new Date().toLocaleDateString(),
    notes || ''
  ]);

  console.log('✅ Logged: ' + filename);
}

/**
 * Test function — run this in Apps Script editor to verify setup.
 * Creates the sheet headers and adds two sample rows.
 */
function RelocationTracker_test() {
  RelocationTracker_init();
  logDocument('2026-02-25_FBI_BackgroundCheck.pdf', 'Uploaded', 'Apostille pending');
  logDocument('2026-02-25_LSU_Diploma.pdf', 'Pending', 'Awaiting confirmation email');
  console.log('✅ Test complete. Check your Sheet.');
}
