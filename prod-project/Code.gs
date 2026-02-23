/**
 * AI-Agents Main Code
 * Environment: Development
 */

// Account verification - prevents wrong-account execution
function checkAccount() {
  const expected = 'chebert4@ebrschools.org';
  const actual = Session.getActiveUser().getEmail();
  if (actual !== expected) {
    throw new Error(`Wrong account! Expected ${expected}, got ${actual}`);
  }
  return true;
}

// Web app entry point
function doGet(e) {
  checkAccount();
  return ContentService.createTextOutput('Dev ready - ' + new Date());
}

function doPost(e) {
  checkAccount();
  const data = JSON.parse(e.postData.contents);
  // Process data here
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    received: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function
function testSetup() {
  Logger.log('Account check: ' + checkAccount());
  Logger.log('Setup complete!');
}
