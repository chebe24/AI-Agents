// =============================================================================
// Router.gs — Gateway-OS Request Router
// =============================================================================
// ALL incoming webhook traffic enters here.
// The Router's only jobs are:
//   1. Answer doGet health checks
//   2. Parse and validate the incoming payload
//   3. Route to the correct Agent based on payload.action
//   4. Return the Agent's response
//
// Business logic does NOT live here. Keep it thin.
// =============================================================================

/**
 * Health check endpoint.
 * Test it by visiting the deployment URL in a browser.
 */
function doGet(e) {
  return buildResponse(200, `Gateway-OS [${ENV}] is online.`);
}

/**
 * Main webhook entry point.
 * All POST requests from n8n, Make, or any external tool arrive here.
 *
 * Expected payload shape:
 * {
 *   "action":  "fileops" | <AgentName>,
 *   ...        (any other fields the Agent needs)
 * }
 */
function doPost(e) {
  try {
    logEvent('WEBHOOK_RECEIVED', {
      timestamp:   new Date().toISOString(),
      contentType: e?.contentType || 'unknown',
      hasBody:     e?.postData ? true : false
    });

    if (!e?.postData?.contents) {
      return buildResponse(400, "Empty request body.");
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return buildResponse(400, "Invalid JSON: " + parseErr.message);
    }

    const action = (payload.action || "").toLowerCase().trim();
    if (!action) {
      return buildResponse(400, "Missing required field: action");
    }

    logEvent('ROUTING', { action });

    switch (action) {

      case "fileops":
        return _Router_handleFileOps(payload);

      case "logentry":
        return LoggerAgent_logEntry(payload);

      // ── Register new Agents below this line ───────────────────────────
      // case "agentname":
      //   return AgentName_init(payload);
      // ──────────────────────────────────────────────────────────────────

      default:
        logEvent('UNKNOWN_ACTION', { action });
        return buildResponse(400, `Unknown action: "${action}". Check Router.gs for registered routes.`);
    }

  } catch (err) {
    logEvent('WEBHOOK_ERROR', { error: err.message });
    return buildResponse(500, "Server error: " + err.message);
  }
}

function _Router_handleFileOps(payload) {
  const fileName    = payload.fileName    || "";
  const subjectCode = payload.subjectCode || "";
  const status      = payload.status      || "";

  if (!fileName || !subjectCode || !status) {
    return buildResponse(400, "fileops requires: fileName, subjectCode, status");
  }

  const validation = validateFileName(fileName);
  const sheet = getOrCreateSheet(SHEET_NAME, [
    "Timestamp", "File Name", "Subject Code", "Status", "Validation", "Errors"
  ]);

  sheet.appendRow([
    new Date(),
    fileName,
    subjectCode,
    status,
    validation.valid ? "PASS" : "FAIL",
    validation.errors.join("; ")
  ]);

  logEvent('FILEOPS_LOGGED', { fileName, valid: validation.valid });

  if (!validation.valid) {
    return buildResponse(200, "Logged with validation errors.", validation.errors);
  }

  return buildResponse(200, "File operation logged successfully.");
}
