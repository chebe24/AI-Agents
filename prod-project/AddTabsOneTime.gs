// =============================================================================
// AddTabsOneTime.gs — ONE-TIME UTILITY to add ChatLogs and ProdLog tabs
// =============================================================================
// Run this once from the Apps Script editor, then you can delete this file.
// =============================================================================

/**
 * Creates ChatLogs and ProdLog tabs in the production sheet
 * Run this function once from the Apps Script editor
 */
function addNewTabs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // =============================================================================
  // 1. Create ChatLogs tab
  // =============================================================================

  let chatLogsSheet = ss.getSheetByName("ChatLogs");
  if (chatLogsSheet) {
    Logger.log("ChatLogs tab already exists, skipping...");
  } else {
    chatLogsSheet = ss.insertSheet("ChatLogs");

    // Set headers
    const chatHeaders = [
      "Timestamp", "Date", "AI Platform", "Project/Context",
      "Conversation Title", "Summary", "Chat URL", "Tags", "Status"
    ];
    chatLogsSheet.getRange(1, 1, 1, chatHeaders.length).setValues([chatHeaders]);

    // Format headers: bold, frozen
    chatLogsSheet.getRange(1, 1, 1, chatHeaders.length)
      .setFontWeight("bold")
      .setBackground("#f3f3f3");
    chatLogsSheet.setFrozenRows(1);

    // Set column widths: A=150, B=100, C=120, D=150, E=200, F=400, G=250, H=150, I=100
    chatLogsSheet.setColumnWidth(1, 150);  // A: Timestamp
    chatLogsSheet.setColumnWidth(2, 100);  // B: Date
    chatLogsSheet.setColumnWidth(3, 120);  // C: AI Platform
    chatLogsSheet.setColumnWidth(4, 150);  // D: Project/Context
    chatLogsSheet.setColumnWidth(5, 200);  // E: Conversation Title
    chatLogsSheet.setColumnWidth(6, 400);  // F: Summary
    chatLogsSheet.setColumnWidth(7, 250);  // G: Chat URL
    chatLogsSheet.setColumnWidth(8, 150);  // H: Tags
    chatLogsSheet.setColumnWidth(9, 100);  // I: Status

    // Add data validation to Status column (I)
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Complete", "Follow-up", "Archived", "In Progress"], true)
      .setAllowInvalid(false)
      .build();
    chatLogsSheet.getRange("I2:I1000").setDataValidation(statusRule);

    // Add sample test row
    const now = new Date();
    const sampleRow = [
      now,
      Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"),
      "Claude Code",
      "Gateway-OS",
      "Add ChatLogs and ProdLog tabs",
      "Created new tabs for chat logging and production event logging with proper formatting and validation",
      "https://claude.ai/chat/...",
      "setup, admin",
      "Complete"
    ];
    chatLogsSheet.getRange(2, 1, 1, sampleRow.length).setValues([sampleRow]);

    Logger.log("✅ ChatLogs tab created successfully");
  }

  // =============================================================================
  // 2. Create ProdLog tab
  // =============================================================================

  let prodLogSheet = ss.getSheetByName("ProdLog");
  if (prodLogSheet) {
    Logger.log("ProdLog tab already exists, skipping...");
  } else {
    prodLogSheet = ss.insertSheet("ProdLog");

    // Set headers
    const prodHeaders = ["Timestamp", "Script", "Event Type", "Status", "Details"];
    prodLogSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);

    // Format headers: bold, frozen
    prodLogSheet.getRange(1, 1, 1, prodHeaders.length)
      .setFontWeight("bold")
      .setBackground("#f3f3f3");
    prodLogSheet.setFrozenRows(1);

    // Set reasonable column widths
    prodLogSheet.setColumnWidth(1, 150);  // A: Timestamp
    prodLogSheet.setColumnWidth(2, 150);  // B: Script
    prodLogSheet.setColumnWidth(3, 120);  // C: Event Type
    prodLogSheet.setColumnWidth(4, 100);  // D: Status
    prodLogSheet.setColumnWidth(5, 400);  // E: Details

    Logger.log("✅ ProdLog tab created successfully");
  }

  // =============================================================================
  // Confirmation
  // =============================================================================

  Logger.log("\n=== SUMMARY ===");
  Logger.log(`Sheet: ${ss.getName()}`);
  Logger.log(`Account: ${ACCOUNT}`);
  Logger.log(`ChatLogs tab: ${chatLogsSheet ? "✅ Created" : "⚠️  Already existed"}`);
  Logger.log(`ProdLog tab: ${prodLogSheet ? "✅ Created" : "⚠️  Already existed"}`);
  Logger.log("\nYou can now delete this AddTabsOneTime.gs file.");

  return {
    success: true,
    message: "Tabs created successfully",
    chatLogsCreated: !ss.getSheetByName("ChatLogs"),
    prodLogCreated: !ss.getSheetByName("ProdLog")
  };
}
