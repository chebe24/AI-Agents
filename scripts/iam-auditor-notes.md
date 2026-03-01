# GC-IAM-Auditor — Planning Notes

> **Status: Not started. GCP infrastructure required before building.**
> When ready, scaffold with: `./ai-agents.sh gem IamAuditor`

---

## What This Does

A monthly automated security check on Google Cloud service accounts.
Flags accounts inactive for 30+ days and logs results to the AI Agents Command Hub sheet.

---

## Prerequisites (must exist before building)

| Item | Detail |
|------|--------|
| GCP staging project | `gc-iam-staging-202602` — IAM and Recommender APIs must be enabled |
| Service Account | `gc-iam-auditor@gc-iam-staging-202602.iam.gserviceaccount.com` |
| SA Roles | `iam.serviceAccountKeyAdmin`, `recommender.viewer` |
| GAS Library | `OAuth2.gs` added to the dev-project |
| Sheet | AI Agents Command Hub (already exists) |

---

## Planned Gateway-OS Integration

- **Gem file:** `dev-project/gems/IamAuditorGem.gs`
- **Trigger:** Monthly time-based (not webhook-driven)
- **Account:** `cary.hebert@gmail.com` (dev only to start)
- **Log target:** AI Agents Command Hub sheet → new tab "IAM Audit"

---

## Code Template (starting point)

```javascript
/**
 * @file      IamAuditorGem.gs
 * @purpose   Monthly IAM key audit — flags service accounts inactive >30 days.
 * @prereqs   OAuth2.gs library, GCP staging project, Service Account configured.
 */

function IamAuditorGem_init(payload) {
  try {
    auditIAMKeys();
    return buildResponse(200, "IAM audit complete.");
  } catch (e) {
    return buildResponse(500, "IAM audit failed: " + e.message);
  }
}

function auditIAMKeys() {
  const service = getIAMService();
  if (!service.hasAccess()) {
    throw new Error("OAuth2 access denied. Check Service Account config.");
  }

  const url = "https://iam.googleapis.com/v1/projects/gc-iam-staging-202602/serviceAccounts";
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + service.getAccessToken() }
  });

  const accounts = JSON.parse(response.getContentText()).accounts || [];
  const cutoff   = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const sheet = getOrCreateSheet("IAM Audit", [
    "Timestamp", "Account", "Last Used", "Status"
  ]);

  accounts.forEach(function(account) {
    const lastUsed = account.lastUsedTime ? new Date(account.lastUsedTime) : null;
    const inactive = !lastUsed || lastUsed < cutoff;

    sheet.appendRow([
      new Date(),
      account.email,
      lastUsed ? lastUsed.toISOString() : "Never",
      inactive ? "INACTIVE" : "OK"
    ]);
  });
}

function getIAMService() {
  // TODO: configure OAuth2 service with Service Account credentials
  // See: https://github.com/googleworkspace/apps-script-oauth2
  return OAuth2.createService("iam-auditor")
    .setTokenUrl("https://oauth2.googleapis.com/token")
    .setPrivateKey(getScriptProperty("IAM_SA_PRIVATE_KEY"))
    .setIssuer(getScriptProperty("IAM_SA_EMAIL"))
    .setScope("https://www.googleapis.com/auth/cloud-platform");
}

function createMonthlyTrigger() {
  // Run once to register the trigger — do not run repeatedly
  ScriptApp.newTrigger("IamAuditorGem_init")
    .timeBased()
    .onMonthDay(1)
    .atHour(6)
    .create();
}

function testSetup() {
  checkAccount();
  Logger.log("OAuth2 access: " + getIAMService().hasAccess());
  Logger.log("Sheet ready: " + getOrCreateSheet("IAM Audit", []).getName());
}
```

---

## Script Properties Required (set in GAS editor, never in code)

| Property Key | Value |
|--------------|-------|
| `IAM_SA_EMAIL` | Service account email |
| `IAM_SA_PRIVATE_KEY` | Service account private key (from JSON key file) |

---

## Build Checklist (when ready to implement)

- [ ] Create GCP staging project `gc-iam-staging-202602`
- [ ] Enable IAM API and Recommender API
- [ ] Create Service Account, assign roles, download key
- [ ] Add OAuth2.gs library to dev-project in GAS editor
- [ ] Set Script Properties (`IAM_SA_EMAIL`, `IAM_SA_PRIVATE_KEY`)
- [ ] Scaffold: `./ai-agents.sh gem IamAuditor`
- [ ] Paste template into generated file, adapt as needed
- [ ] Run `testSetup()` in GAS editor
- [ ] Run `auditIAMKeys()` manually to verify logging
- [ ] Run `createMonthlyTrigger()` once to schedule
- [ ] Deploy: `./ai-agents.sh deploy dev`
