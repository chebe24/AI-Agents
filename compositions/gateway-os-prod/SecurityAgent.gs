/**
 * @file      SecurityAgent.gs
 * @author    Cary Hebert
 * @created   2026-03-07
 * @version   1.0.0
 *
 * Gateway-OS Security Module — Project Sentinel Implementation
 *
 * PROJECT SENTINEL COMPLIANCE
 *   ✅ Zero-Code Storage - All credentials in Script Properties
 *   ✅ Identity Guardrail - Email verification on all operations
 *   ✅ Audit Logging - Security_Audit tab tracks all events
 *   ✅ Fail-Safe Configuration - Missing properties throw explicit errors
 *
 * USAGE
 *   Import this module in all Agents and call checkAuthorization() at entry points.
 *   All security events are automatically logged to Security_Audit tab.
 */

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

/**
 * Security configuration with fail-safe getters.
 * All values retrieved from Script Properties - NEVER hardcoded.
 */
const SECURITY_CONFIG = {
  /**
   * Get authorized email from Script Properties.
   * This is the ONLY email allowed to execute Gateway-OS functions.
   */
  get authorizedEmail() {
    const email = PropertiesService.getScriptProperties().getProperty('AUTHORIZED_EMAIL');
    if (!email) {
      throw new Error('🚨 SECURITY ERROR: AUTHORIZED_EMAIL not configured in Script Properties');
    }
    return email;
  },

  /**
   * Get spreadsheet ID from Script Properties.
   * Used for audit logging and data operations.
   */
  get spreadsheetId() {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) {
      throw new Error('🚨 SECURITY ERROR: SPREADSHEET_ID not configured in Script Properties');
    }
    return id;
  },

  /**
   * Get environment name (production/development).
   */
  get environment() {
    return PropertiesService.getScriptProperties().getProperty('ENVIRONMENT') || 'production';
  }
};

// =============================================================================
// IDENTITY GUARDRAIL - Authorization Checks
// =============================================================================

/**
 * **CRITICAL SECURITY FUNCTION**
 *
 * Verifies the current user is authorized to execute Gateway-OS functions.
 * Call this at the entry point of ALL public functions.
 *
 * ZERO-TRUST MODEL:
 *   - Verify identity on EVERY execution
 *   - No assumptions about authentication state
 *   - Log both successful and failed attempts
 *
 * @throws {Error} If user is not authorized
 * @returns {Object} Authorization details { user, timestamp, authorized: true }
 */
function SecurityAgent_checkAuthorization() {
  const currentUser = Session.getActiveUser().getEmail();
  const authorizedEmail = SECURITY_CONFIG.authorizedEmail;
  const timestamp = new Date().toISOString();

  // Check authorization
  if (currentUser !== authorizedEmail) {
    // Log security violation
    SecurityAgent_logEvent('UNAUTHORIZED_ACCESS_ATTEMPT', 'ERROR', {
      attemptedBy: currentUser,
      expectedUser: authorizedEmail,
      timestamp: timestamp
    });

    // Throw error to halt execution
    const errorMsg = `🚨 SECURITY VIOLATION: Unauthorized access attempt by ${currentUser}. Expected: ${authorizedEmail}`;
    throw new Error(errorMsg);
  }

  // Log successful authorization
  SecurityAgent_logEvent('AUTHORIZED_ACCESS', 'INFO', {
    user: currentUser,
    timestamp: timestamp
  });

  return {
    user: currentUser,
    timestamp: timestamp,
    authorized: true
  };
}

/**
 * Validates all required Script Properties are configured.
 * Run this during setup or deployment to verify configuration.
 *
 * @returns {Object} Validation result with status and missing properties
 */
function SecurityAgent_validateConfiguration() {
  const required = ['AUTHORIZED_EMAIL', 'SPREADSHEET_ID', 'ENVIRONMENT'];
  const missing = [];
  const configured = [];

  const scriptProps = PropertiesService.getScriptProperties();

  for (const prop of required) {
    const value = scriptProps.getProperty(prop);
    if (!value) {
      missing.push(prop);
    } else {
      configured.push({ property: prop, value: value });
    }
  }

  const isValid = missing.length === 0;

  SecurityAgent_logEvent(
    isValid ? 'CONFIGURATION_VALID' : 'CONFIGURATION_INVALID',
    isValid ? 'INFO' : 'ERROR',
    {
      configured: configured.length,
      missing: missing.length,
      missingProperties: missing
    }
  );

  return {
    valid: isValid,
    missing: missing,
    configured: configured
  };
}

// =============================================================================
// AUDIT LOGGING - Security Event Tracking
// =============================================================================

/**
 * Logs a security event to the Security_Audit tab.
 *
 * Creates forensic audit trail for:
 *   - Authorization checks (successful and failed)
 *   - Configuration changes
 *   - Data access events
 *   - Error conditions
 *
 * @param {string} eventType - Event identifier (e.g., 'AUTHORIZED_ACCESS')
 * @param {string} severity - 'INFO' | 'WARN' | 'ERROR'
 * @param {Object} details - Event metadata (user, timestamp, etc.)
 */
function SecurityAgent_logEvent(eventType, severity, details) {
  try {
    const ss = SpreadsheetApp.openById(SECURITY_CONFIG.spreadsheetId);
    let sheet = ss.getSheetByName('Security_Audit');

    // Create the Security_Audit tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Security_Audit');
      const headers = [
        'Timestamp',
        'Event Type',
        'Severity',
        'User',
        'Environment',
        'Details'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1a1a1a')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Prepare row data
    const timestamp = new Date();
    const user = details.user || Session.getActiveUser().getEmail() || 'system';
    const environment = SECURITY_CONFIG.environment;
    const detailsJson = JSON.stringify(details);

    // Append the row
    sheet.appendRow([
      timestamp,
      eventType,
      severity,
      user,
      environment,
      detailsJson
    ]);

    // Color-code by severity
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, 6);

    switch (severity) {
      case 'ERROR':
        range.setBackground('#FFCDD2'); // soft red
        break;
      case 'WARN':
        range.setBackground('#FFF9C4'); // soft yellow
        break;
      case 'INFO':
        range.setBackground('#E8F5E9'); // soft green
        break;
      default:
        range.setBackground(null);
    }

  } catch (e) {
    // Fallback logging if sheet access fails
    console.error(`Security_Audit logging failed: ${e.message}`);
    Logger.log(`SECURITY_EVENT | ${eventType} | ${severity} | ${JSON.stringify(details)}`);
    // Don't throw - logging errors shouldn't break main flow
  }
}

// =============================================================================
// CONFIGURATION HELPERS
// =============================================================================

/**
 * Sets up required Script Properties for Project Sentinel compliance.
 * Run this ONCE during initial deployment.
 *
 * @param {string} authorizedEmail - Email address allowed to execute functions
 * @param {string} spreadsheetId - Google Sheets ID for logging
 * @param {string} environment - 'production' or 'development'
 */
function SecurityAgent_setupScriptProperties(authorizedEmail, spreadsheetId, environment) {
  const scriptProps = PropertiesService.getScriptProperties();

  scriptProps.setProperties({
    'AUTHORIZED_EMAIL': authorizedEmail,
    'SPREADSHEET_ID': spreadsheetId,
    'ENVIRONMENT': environment || 'production'
  });

  SecurityAgent_logEvent('CONFIGURATION_UPDATED', 'INFO', {
    authorizedEmail: authorizedEmail,
    environment: environment,
    timestamp: new Date().toISOString()
  });

  Logger.log('✅ Script Properties configured successfully');
  Logger.log(`   AUTHORIZED_EMAIL: ${authorizedEmail}`);
  Logger.log(`   SPREADSHEET_ID: ${spreadsheetId}`);
  Logger.log(`   ENVIRONMENT: ${environment}`);

  return {
    success: true,
    message: 'Script Properties configured for Project Sentinel compliance'
  };
}

/**
 * Views all current Script Properties (for debugging).
 * Returns a sanitized view (IDs truncated for security).
 */
function SecurityAgent_viewConfiguration() {
  const scriptProps = PropertiesService.getScriptProperties();
  const allProps = scriptProps.getProperties();
  const sanitized = {};

  for (const key in allProps) {
    const value = allProps[key];
    // Sanitize IDs (show first 8 chars only)
    if (key.includes('ID') && value.length > 12) {
      sanitized[key] = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    } else {
      sanitized[key] = value;
    }
  }

  Logger.log('=== Script Properties (Sanitized) ===');
  Logger.log(JSON.stringify(sanitized, null, 2));

  return sanitized;
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test authorization with current user.
 * Run this to verify SecurityAgent is working correctly.
 */
function SecurityAgent_testAuthorization() {
  Logger.log('=== Testing Authorization ===');

  try {
    const result = SecurityAgent_checkAuthorization();
    Logger.log('✅ Authorization successful');
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    Logger.log('❌ Authorization failed');
    Logger.log(e.message);
    throw e;
  }
}

/**
 * Test configuration validation.
 * Run this to check all required Script Properties are set.
 */
function SecurityAgent_testConfiguration() {
  Logger.log('=== Testing Configuration ===');

  const result = SecurityAgent_validateConfiguration();

  if (result.valid) {
    Logger.log('✅ Configuration is valid');
    Logger.log(`   Configured properties: ${result.configured.length}`);
  } else {
    Logger.log('❌ Configuration is invalid');
    Logger.log(`   Missing properties: ${result.missing.join(', ')}`);
  }

  return result;
}
