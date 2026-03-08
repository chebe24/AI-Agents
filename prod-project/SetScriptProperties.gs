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
 * 🔒 PROJECT SENTINEL SETUP
 * Sets ALL required Script Properties for production environment.
 * Run this ONCE after deploying to production.
 */
function setupProductionSecurity() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // Required production values
  const PROD_SPREADSHEET_ID = "1kWtc6Z_kdgCEMCkYyLd9U300MGxdZLr0NzNSESIUsUE";
  const AUTHORIZED_EMAIL = "cary.hebert@gmail.com";
  const ENVIRONMENT = "production";
  const GITHUB_URL = "https://raw.githubusercontent.com/chebe24/AI-Agents/main/pattern-registry.yaml";

  Logger.log("=== Setting Production Script Properties ===");

  // Set all properties
  scriptProperties.setProperties({
    'SPREADSHEET_ID': PROD_SPREADSHEET_ID,
    'AUTHORIZED_EMAIL': AUTHORIZED_EMAIL,
    'ENVIRONMENT': ENVIRONMENT,
    'GITHUB_REGISTRY_URL': GITHUB_URL
  });

  Logger.log("✅ SPREADSHEET_ID set");
  Logger.log("✅ AUTHORIZED_EMAIL set");
  Logger.log("✅ ENVIRONMENT set");
  Logger.log("✅ GITHUB_REGISTRY_URL set");

  // Verify configuration
  Logger.log("");
  Logger.log("=== Verifying Configuration ===");
  const result = SecurityAgent_validateConfiguration();

  if (result.valid) {
    Logger.log("✅ All Script Properties configured successfully!");
    Logger.log("🔒 Project Sentinel compliance active");
    return {
      success: true,
      message: "Production security configured successfully"
    };
  } else {
    Logger.log("❌ Configuration incomplete");
    Logger.log(`Missing: ${result.missing.join(', ')}`);
    return {
      success: false,
      missing: result.missing
    };
  }
}

/**
 * Sets the GITHUB_REGISTRY_URL Script Property for PatternRegistryAgent
 * Run this function once from the Apps Script editor
 */
function setGitHubRegistryURL() {
  const scriptProperties = PropertiesService.getScriptProperties();

  const GITHUB_URL = "https://raw.githubusercontent.com/chebe24/AI-Agents/main/pattern-registry.yaml";

  Logger.log("=== Setting GITHUB_REGISTRY_URL ===");
  Logger.log(`URL: ${GITHUB_URL}`);

  // Set the property
  scriptProperties.setProperty('GITHUB_REGISTRY_URL', GITHUB_URL);

  // Verify by reading it back
  const verifyValue = scriptProperties.getProperty('GITHUB_REGISTRY_URL');

  Logger.log("");
  Logger.log("=== Verification ===");
  Logger.log(`Expected: ${GITHUB_URL}`);
  Logger.log(`Actual:   ${verifyValue}`);
  Logger.log(`Match:    ${verifyValue === GITHUB_URL ? "✅ YES" : "❌ NO"}`);

  if (verifyValue === GITHUB_URL) {
    Logger.log("✅ GITHUB_REGISTRY_URL set successfully!");
    return {
      success: true,
      property: "GITHUB_REGISTRY_URL",
      value: verifyValue
    };
  } else {
    Logger.log("❌ Verification failed!");
    return {
      success: false,
      property: "GITHUB_REGISTRY_URL",
      expected: GITHUB_URL,
      actual: verifyValue
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
