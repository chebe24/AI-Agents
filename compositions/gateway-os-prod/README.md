# Gateway-OS Production Composition

**Environment:** Production
**Account:** cary.hebert@gmail.com
**Version:** 2.0.0
**Status:** Active

---

## Overview

Production deployment of Gateway-OS automation platform. Full-featured composition with all security, routing, and agent blocks enabled.

---

## Included Blocks

### Core Infrastructure (3)
- **SecurityAgent** - Project Sentinel security
- **Router** - Webhook routing
- **Utilities** - Shared helpers

### Business Logic Agents (3)
- **InventoryAgent** - Drive folder scanning
- **LoggerAgent** - Chat log management
- **PatternRegistryAgent** - GitHub YAML pattern sync

### Additional Files (2)
- **Config.gs** - Environment configuration
- **Triggers.gs** - Time-based automation

**Total:** 8 files assembled from blocks

---

## Build Process

This composition is assembled automatically from blocks:

```bash
./scripts/compose.sh gateway-os-prod
```

This will:
1. Read `manifest.json`
2. Copy core blocks from `blocks/core/`
3. Copy agent blocks from `blocks/agents/`
4. Copy additional files from `prod-project/`
5. Generate `.clasp.json` with correct script ID
6. Generate `appsscript.json` with timezone
7. Ready for `clasp push`

---

## Script Properties

### Required

| Property | Value | Purpose |
|----------|-------|---------|
| `AUTHORIZED_EMAIL` | cary.hebert@gmail.com | SecurityAgent authorization |
| `SPREADSHEET_ID` | 1kWtc6Z_... | Command Hub sheet |
| `ENVIRONMENT` | production | Environment identifier |
| `GITHUB_REGISTRY_URL` | https://raw... | Pattern registry source |

### Optional

| Property | Value | Purpose |
|----------|-------|---------|
| `DRIVE_FOLDER_ID` | (if using InventoryAgent) | Drive folder to scan |

---

## Deployment

### Initial Setup

```bash
# 1. Build composition
./scripts/compose.sh gateway-os-prod

# 2. Deploy to GAS
cd compositions/gateway-os-prod
clasp push

# 3. Configure Script Properties
# Run in Apps Script editor:
setupProductionSecurity()

# 4. Install triggers
Triggers_install()

# 5. Deploy as web app
# Apps Script → Deploy → New deployment
```

### Updates

```bash
# Rebuild and redeploy
./scripts/compose.sh gateway-os-prod
cd compositions/gateway-os-prod
clasp push
```

---

## Web App URL

After deployment:
https://script.google.com/macros/s/AKfycb.../exec

---

## Webhook Routes

| Action | Handler | Purpose |
|--------|---------|---------|
| `fileops` | _Router_handleFileOps | File operation logging |
| `logentry` | LoggerAgent_logEntry | Chat log entry |
| `syncpatterns` | PatternRegistryAgent_sync | Pattern sync |
| `inventory` | InventoryAgent_init | Drive inventory scan |

---

## Sheets Created

- File Ops
- ChatLogs
- ProdLog
- Security_Audit
- PatternRegistry
- Inventory

---

## Testing

```javascript
// Test security
SecurityAgent_runAllTests()

// Test pattern sync
PatternRegistryAgent_testSync()

// Test logger
LoggerAgent_testValid()

// Test inventory (if DRIVE_FOLDER_ID set)
InventoryAgent_init({})
```

---

## Monitoring

Check these tabs regularly:
- **Security_Audit** - Authorization attempts, security events
- **ProdLog** - Agent execution logs
- **ChatLogs** - Logged conversations

---

## Triggers

Installed by `Triggers_install()`:

- **PatternRegistryAgent_sync** - Every 24 hours at 2 AM
- **PatternRegistryAgent_sync** - On spreadsheet open

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-07 | Migrated to block composition architecture |
| 1.0.0 | 2026-03-01 | Initial production deployment |

---

## Related

- Source blocks: `/blocks/`
- Dev environment: `/compositions/gateway-os-dev/`
- Build script: `/scripts/compose.sh`
