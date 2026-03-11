/**
 * @file      PatternRegistryAgent.gs
 * @author    Cary Hebert
 * @created   2026-03-07
 * @version   1.0.0
 *
 * Gateway-OS Agent — syncs pattern-registry.yaml from GitHub to PatternRegistry sheet tab.
 *
 * ROUTER CONTRACT
 *   Router.gs calls PatternRegistryAgent_sync() when payload.action === "syncpatterns"
 *
 * FUNCTIONALITY
 *   - Fetches pattern-registry.yaml from GitHub raw URL (stored in Script Properties)
 *   - Parses YAML structure into pattern objects
 *   - Writes all patterns to "PatternRegistry" tab in Command Hub
 *   - Tab headers: PatternKey | Subject | FileType | Regex | Example | Version | LastUpdated
 *   - Overwrites tab completely on each sync (not append)
 *   - Logs sync result to ProdLog tab
 *
 * SCRIPT PROPERTIES REQUIRED
 *   - SPREADSHEET_ID: The Command Hub sheet ID
 *   - GITHUB_REGISTRY_URL: GitHub raw URL for pattern-registry.yaml
 */

// =============================================================================
// PUBLIC FUNCTIONS
// =============================================================================

/**
 * Main sync function - fetches GitHub YAML and writes to PatternRegistry tab.
 * Can be called via webhook (action: "syncpatterns") or time-based trigger.
 *
 * @returns {Object} Response with sync status and details
 */
function PatternRegistryAgent_sync() {
  try {
    _ProdLog_write("PatternRegistryAgent", "SYNC_START", "INFO", "Starting pattern registry sync from GitHub");

    // Get GitHub URL from Script Properties
    const githubUrl = PropertiesService.getScriptProperties().getProperty('GITHUB_REGISTRY_URL');
    if (!githubUrl) {
      throw new Error("GITHUB_REGISTRY_URL not set in Script Properties");
    }

    // Fetch YAML from GitHub
    _ProdLog_write("PatternRegistryAgent", "FETCH_YAML", "INFO", `Fetching from: ${githubUrl}`);
    const response = UrlFetchApp.fetch(githubUrl);
    const yamlContent = response.getContentText();

    // Parse YAML into pattern objects
    const patterns = _parsePatternYAML(yamlContent);
    _ProdLog_write("PatternRegistryAgent", "PARSE_COMPLETE", "INFO", `Parsed ${patterns.length} patterns`);

    // Write to PatternRegistry tab
    const result = _writeToPatternRegistry(patterns);

    _ProdLog_write(
      "PatternRegistryAgent",
      "SYNC_COMPLETE",
      "INFO",
      `Synced ${patterns.length} patterns to PatternRegistry tab`
    );

    return _buildPlainResponse(200, "Pattern registry synced successfully", {
      patternsCount: patterns.length,
      sheetName: result.sheetName,
      rowsWritten: result.rowsWritten
    });

  } catch (e) {
    _ProdLog_write("PatternRegistryAgent", "SYNC_ERROR", "ERROR", e.message);
    return _buildPlainResponse(500, "PatternRegistryAgent sync error: " + e.message);
  }
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/**
 * Parses the pattern-registry.yaml content and extracts pattern definitions.
 * Returns an array of pattern objects.
 *
 * @param {string} yamlContent - Raw YAML file content
 * @returns {Array<Object>} Array of pattern objects
 */
function _parsePatternYAML(yamlContent) {
  const patterns = [];
  const lines = yamlContent.split('\n');

  let inPatternsSection = false;
  let currentPattern = null;
  let version = "6.0"; // default

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract version from metadata
    if (line.trim().startsWith('version:')) {
      version = line.split(':')[1].trim().replace(/"/g, '');
      continue;
    }

    // Detect patterns section
    if (line.trim() === 'patterns:') {
      inPatternsSection = true;
      continue;
    }

    if (!inPatternsSection) continue;

    // Detect new pattern (starts with 2 spaces and ends with colon, no leading #)
    if (/^  [a-z_]+:$/.test(line) && !line.trim().startsWith('#')) {
      // Save previous pattern if exists
      if (currentPattern && currentPattern.patternKey) {
        patterns.push(currentPattern);
      }

      // Start new pattern
      const patternKey = line.trim().replace(':', '');
      currentPattern = {
        patternKey: patternKey,
        subject: '',
        filetype: '',
        regex: '',
        example: '',
        version: version
      };
      continue;
    }

    // Parse pattern properties (4 spaces indent)
    if (currentPattern && /^    [a-z_]+:/.test(line)) {
      const keyValue = line.trim().split(':');
      const key = keyValue[0].trim();
      const value = keyValue.slice(1).join(':').trim().replace(/"/g, '');

      switch(key) {
        case 'subject':
          currentPattern.subject = value;
          break;
        case 'filetype':
          currentPattern.filetype = value;
          break;
        case 'full_regex':
          currentPattern.regex = value;
          break;
        case 'example':
          currentPattern.example = value;
          break;
      }
    }
  }

  // Don't forget the last pattern
  if (currentPattern && currentPattern.patternKey) {
    patterns.push(currentPattern);
  }

  return patterns;
}

/**
 * Writes pattern data to the PatternRegistry tab, overwriting existing content.
 *
 * @param {Array<Object>} patterns - Array of pattern objects
 * @returns {{ sheetName: string, rowsWritten: number }}
 */
function _writeToPatternRegistry(patterns) {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
  let sheet = ss.getSheetByName("PatternRegistry");

  // Create tab if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet("PatternRegistry");
  } else {
    // Clear existing content
    sheet.clear();
  }

  // Write headers
  const headers = [
    "PatternKey", "Subject", "FileType", "Regex", "Example", "Version", "LastUpdated"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
  sheet.setFrozenRows(1);

  // Write pattern data
  const now = new Date();
  const data = patterns.map(p => [
    p.patternKey || '',
    p.subject || '',
    p.filetype || '',
    p.regex || '',
    p.example || '',
    p.version || '',
    now
  ]);

  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }

  // Auto-resize columns for readability
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return {
    sheetName: "PatternRegistry",
    rowsWritten: data.length
  };
}

/**
 * Build a plain response object for direct function calls.
 * Matches the pattern used in LoggerAgent.gs.
 *
 * @param {number} code - HTTP status code
 * @param {string} message - Response message
 * @param {Object} data - Optional data payload
 * @returns {Object} Plain response object
 */
function _buildPlainResponse(code, message, data) {
  return {
    code: code,
    message: message,
    data: data || {},
    env: ENV
  };
}

/**
 * Writes a row to the ProdLog tab for production execution tracking.
 * This is a copy of the function from LoggerAgent.gs to avoid circular dependencies.
 *
 * @param {string} script - Script name (e.g., "PatternRegistryAgent")
 * @param {string} eventType - Event type (e.g., "SYNC_START")
 * @param {string} status - "INFO" | "WARN" | "ERROR"
 * @param {string} details - Additional details
 */
function _ProdLog_write(script, eventType, status, details) {
  try {
    const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    let sheet = ss.getSheetByName("ProdLog");

    // Create the tab if it doesn't exist (safety fallback)
    if (!sheet) {
      sheet = ss.insertSheet("ProdLog");
      const headers = ["Timestamp", "Script", "Event Type", "Status", "Details"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }

    // Append the row
    sheet.appendRow([
      new Date(),
      script,
      eventType,
      status,
      details
    ]);

    // Color-code by status
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, 5);
    switch (status) {
      case "WARN":
        range.setBackground("#FFF9C4"); // soft yellow
        break;
      case "ERROR":
        range.setBackground("#FFCDD2"); // soft red
        break;
      default:
        range.setBackground(null); // white
    }
  } catch (e) {
    Logger.log(`ProdLog write failed: ${e.message}`);
    // Don't throw - logging errors shouldn't break the main flow
  }
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test function to verify PatternRegistryAgent sync.
 * Run from Apps Script editor.
 *
 * PREREQUISITES:
 *   - SPREADSHEET_ID must be set in Script Properties
 *   - GITHUB_REGISTRY_URL must be set in Script Properties
 */
function PatternRegistryAgent_testSync() {
  const result = PatternRegistryAgent_sync();
  Logger.log("Pattern registry sync test result:");
  Logger.log(JSON.stringify(result, null, 2));
}
