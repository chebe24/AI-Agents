// =============================================================================
// SetScriptProperties.gs — ONE-TIME UTILITY to set Script Properties
// =============================================================================
// Run this once from the Apps Script editor, then you can delete this file.
// Script Properties are key-value pairs stored in the project settings.
// =============================================================================

/**
 * Sets the SPREADSHEET_ID Script Property and verifies it
 * Run this function once from the Apps Script editor
 */
function setProductionScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // The spreadsheet ID to set
  const PROD_SPREADSHEET_ID = "1qEZUBf4A1djNF5CstRxJa2UQbQqCnIZqavSF8mkKUpU";

  Logger.log("=== Setting Script Properties ===");
  Logger.log(`Account: ${ACCOUNT}`);
  Logger.log(`Environment: ${ENV}`);
  Logger.log("");

  // Set the property
  Logger.log(`Setting SPREADSHEET_ID = ${PROD_SPREADSHEET_ID}`);
  scriptProperties.setProperty('SPREADSHEET_ID', PROD_SPREADSHEET_ID);

  // Verify by reading it back
  const verifyValue = scriptProperties.getProperty('SPREADSHEET_ID');

  Logger.log("");
  Logger.log("=== Verification ===");
  Logger.log(`Expected: ${PROD_SPREADSHEET_ID}`);
  Logger.log(`Actual:   ${verifyValue}`);
  Logger.log(`Match:    ${verifyValue === PROD_SPREADSHEET_ID ? "✅ YES" : "❌ NO"}`);

  if (verifyValue === PROD_SPREADSHEET_ID) {
    Logger.log("");
    Logger.log("✅ Script Property set successfully!");
    Logger.log("You can now delete this SetScriptProperties.gs file.");
    return {
      success: true,
      property: "SPREADSHEET_ID",
      value: verifyValue,
      message: "Script Property set and verified successfully"
    };
  } else {
    Logger.log("");
    Logger.log("❌ Verification failed!");
    return {
      success: false,
      property: "SPREADSHEET_ID",
      expected: PROD_SPREADSHEET_ID,
      actual: verifyValue,
      message: "Verification failed - values do not match"
    };
  }
}

/**
 * Helper function to view all current Script Properties
 * Useful for debugging
 */
function viewAllScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const allProperties = scriptProperties.getProperties();

  Logger.log("=== All Script Properties ===");
  for (const key in allProperties) {
    Logger.log(`${key} = ${allProperties[key]}`);
  }

  if (Object.keys(allProperties).length === 0) {
    Logger.log("(No properties set)");
  }

  return allProperties;
}
