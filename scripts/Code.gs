/**
 * AI-Agents Main Code
 * Environment: Development
 * 
 * This template provides:
 * - Account verification (security)
 * - Web app endpoints (doGet/doPost)
 * - Basic logging
 */

// =============================================================================
// CONFIGURATION - UPDATE THESE
// =============================================================================

const CONFIG = {
  expectedAccount: 'cary.hebert@gmail.com',  // Dev Google account
  environment: 'development',
  version: '1.0.0'
};

// =============================================================================
// SECURITY
// =============================================================================

/**
 * Verify the executing account matches expected.
 * Prevents accidental execution from wrong account.
 */
function checkAccount() {
  const actual = Session.getActiveUser().getEmail();
  if (actual !== CONFIG.expectedAccount) {
    throw new Error(
      `Account mismatch! Expected: ${CONFIG.expectedAccount}, Got: ${actual}`
    );
  }
  return true;
}

// =============================================================================
// WEB APP ENDPOINTS
// =============================================================================

/**
 * Handle GET requests
 * Used for: Status checks, simple data retrieval
 */
function doGet(e) {
  try {
    checkAccount();
    
    const response = {
      status: 'ok',
      environment: CONFIG.environment,
      version: CONFIG.version,
      timestamp: new Date().toISOString(),
      message: 'Dev ready'
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests
 * Used for: iOS Shortcuts, webhooks, data submission
 */
function doPost(e) {
  try {
    checkAccount();
    
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Log for debugging
    Logger.log('Received POST: ' + JSON.stringify(data));
    
    // Process based on action
    let result;
    switch (data.action) {
      case 'ping':
        result = { pong: true };
        break;
      case 'log':
        result = logToSheet(data.payload);
        break;
      default:
        result = { received: data };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        result: result
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('POST Error: ' + error.message);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Log data to a Google Sheet
 * @param {Object} payload - Data to log
 */
function logToSheet(payload) {
  // TODO: Update with your Sheet ID
  const SHEET_ID = 'YOUR_SHEET_ID_HERE';
  
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    sheet.appendRow([
      new Date(),
      JSON.stringify(payload)
    ]);
    return { logged: true };
  } catch (e) {
    return { logged: false, error: e.message };
  }
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test the setup - run this first!
 */
function testSetup() {
  Logger.log('=== AI-Agents Test ===');
  Logger.log('Environment: ' + CONFIG.environment);
  Logger.log('Version: ' + CONFIG.version);
  
  try {
    checkAccount();
    Logger.log('✓ Account check passed');
  } catch (e) {
    Logger.log('✗ Account check failed: ' + e.message);
  }
  
  Logger.log('=== Test Complete ===');
}

/**
 * Test POST handling locally
 */
function testPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'ping',
        payload: { test: true }
      })
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('POST result: ' + result.getContent());
}
