// =============================================================================
// Router.gs — Gateway-OS Request Router (PRODUCTION)
// =============================================================================
// ALL incoming webhook traffic enters here.
// Secured by WEBHOOK_SECRET stored in Script Properties.
// =============================================================================

/**
 * Health check endpoint.
 */
function doGet(e) {
  return buildResponse(200, `Gateway-OS [${ENV}] is online.`);
}

/**
 * Main webhook entry point.
 *
 * Expected payload shape:
 * {
 *   "secret": "<WEBHOOK_SECRET>",
 *   "action": "fileops" | <GemName>,
 *   ...
 * }
 */
function doPost(e) {
  try {
    logEvent('WEBHOOK_RECEIVED', {
      timestamp:   new Date().toISOString(),
      contentType: e?.contentType || 'unknown',
      hasBody:     e?.postData ? true : false
    });

    // ── 1. Guard: require a request body ──────────────────────────────────
    if (!e?.postData?.contents) {
      return buildResponse(400, "Empty request body.");
    }

    // ── 2. Parse JSON ──────────────────────────────────────────────────────
    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return buildResponse(400, "Invalid JSON: " + parseErr.message);
    }

    // ── 3. Verify webhook secret ───────────────────────────────────────────
    const expectedSecret = getScriptProperty('WEBHOOK_SECRET');
    if (expectedSecret && payload.secret !== expectedSecret) {
      logEvent('AUTH_FAILURE', { reason: 'Invalid webhook secret' });
      return buildResponse(403, "Unauthorized.");
    }

    // ── 4. Require an action field ─────────────────────────────────────────
    const action = (payload.action || "").toLowerCase().trim();
    if (!action) {
      return buildResponse(400, "Missing required field: action");
    }

    logEvent('ROUTING', { action });

    // ── 5. Route to the correct Gem ────────────────────────────────────────
    switch (action) {

      case "fileops":
        return _Router_handleFileOps(payload);

      // ── Register new Gems below this line ─────────────────────────────
      // case "mygemname":
      //   return MyGemName_init(payload);
      // ──────────────────────────────────────────────────────────────────

      default:
        logEvent('UNKNOWN_ACTION', { action });
        return buildResponse(400, `Unknown action: "${action}".`);
    }

  } catch (err) {
    logEvent('WEBHOOK_ERROR', { error: err.message });
    return buildResponse(500, "Server error: " + err.message);
  }
}

// =============================================================================
// INLINE HANDLER — File Ops
// =============================================================================

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
