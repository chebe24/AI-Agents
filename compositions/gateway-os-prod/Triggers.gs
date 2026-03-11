/**
 * @file      Triggers.gs
 * @author    Cary Hebert
 * @created   2026-03-07
 * @version   1.0.0
 *
 * Gateway-OS Trigger Management — sets up time-based and event-based triggers.
 *
 * FUNCTIONALITY
 *   - Creates time-based trigger to sync PatternRegistry every 24 hours
 *   - Creates onOpen trigger to sync PatternRegistry when spreadsheet opens
 *   - Provides functions to install and uninstall triggers
 *
 * USAGE
 *   Run Triggers_install() once from Apps Script editor to set up all triggers.
 *   Run Triggers_uninstall() to remove all triggers.
 */

// =============================================================================
// TRIGGER INSTALLATION
// =============================================================================

/**
 * Installs all triggers for Gateway-OS production.
 * Run this function once from the Apps Script editor after deployment.
 *
 * Creates:
 *   1. Time-based trigger: PatternRegistryAgent_sync() every 24 hours
 *   2. onOpen trigger: PatternRegistryAgent_sync() when spreadsheet opens
 */
function Triggers_install() {
  try {
    // Remove any existing triggers first to avoid duplicates
    Triggers_uninstall();

    // Create time-based trigger (every 24 hours)
    ScriptApp.newTrigger('PatternRegistryAgent_sync')
      .timeBased()
      .everyDays(1)
      .atHour(2) // Run at 2 AM (adjust timezone as needed)
      .create();

    Logger.log("✓ Installed time-based trigger: PatternRegistryAgent_sync every 24 hours at 2 AM");

    // Create onOpen trigger
    ScriptApp.newTrigger('PatternRegistryAgent_sync')
      .forSpreadsheet(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'))
      .onOpen()
      .create();

    Logger.log("✓ Installed onOpen trigger: PatternRegistryAgent_sync on spreadsheet open");

    _ProdLog_write(
      "Triggers",
      "INSTALL_COMPLETE",
      "INFO",
      "All triggers installed successfully"
    );

    return {
      success: true,
      message: "Triggers installed successfully",
      triggers: [
        "PatternRegistryAgent_sync (time-based, every 24 hours)",
        "PatternRegistryAgent_sync (onOpen)"
      ]
    };

  } catch (e) {
    _ProdLog_write(
      "Triggers",
      "INSTALL_ERROR",
      "ERROR",
      `Error installing triggers: ${e.message}`
    );

    Logger.log("✗ Error installing triggers: " + e.message);
    return {
      success: false,
      message: "Error installing triggers: " + e.message
    };
  }
}

/**
 * Uninstalls all project triggers.
 * Run this function to clean up before reinstalling or debugging.
 */
function Triggers_uninstall() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let count = 0;

    for (let i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
      count++;
    }

    Logger.log(`✓ Uninstalled ${count} trigger(s)`);

    _ProdLog_write(
      "Triggers",
      "UNINSTALL_COMPLETE",
      "INFO",
      `Uninstalled ${count} trigger(s)`
    );

    return {
      success: true,
      message: `Uninstalled ${count} trigger(s)`,
      count: count
    };

  } catch (e) {
    Logger.log("✗ Error uninstalling triggers: " + e.message);
    return {
      success: false,
      message: "Error uninstalling triggers: " + e.message
    };
  }
}

/**
 * Lists all currently installed triggers.
 * Run this function to check what triggers are active.
 */
function Triggers_list() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerInfo = [];

  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    triggerInfo.push({
      handlerFunction: trigger.getHandlerFunction(),
      eventType: trigger.getEventType().toString(),
      triggerSource: trigger.getTriggerSource().toString(),
      uniqueId: trigger.getUniqueId()
    });
  }

  Logger.log("Active triggers:");
  Logger.log(JSON.stringify(triggerInfo, null, 2));

  return triggerInfo;
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/**
 * Writes a row to the ProdLog tab for trigger events.
 * This is a copy of the function from LoggerAgent.gs to avoid circular dependencies.
 *
 * @param {string} script - Script name (e.g., "Triggers")
 * @param {string} eventType - Event type (e.g., "INSTALL_COMPLETE")
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
