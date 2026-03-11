# Gateway-OS Compositions

**Purpose:** Assembled applications built from reusable agent blocks
**Build System:** Automated composition via `scripts/compose.sh`
**Version:** 2.0.0

---

## Overview

Compositions are **deployable Google Apps Script projects** assembled from agent blocks. Each composition mixes and matches blocks based on its specific needs.

### Concept

```
blocks/                     compositions/
├── core/                  ├── gateway-os-prod/
│   ├── Security/          │   ├── manifest.json      ← Defines which blocks
│   ├── Router/            │   ├── .clasp.json        ← Generated
│   └── Utilities/         │   ├── appsscript.json    ← Generated
└── agents/                │   ├── SecurityAgent.gs   ← Copied from blocks/
    ├── InventoryAgent/    │   ├── Router.gs          ← Copied from blocks/
    ├── LoggerAgent/       │   ├── Utilities.gs       ← Copied from blocks/
    └── ...                │   └── ...                ← Assembled files
                           │
                           └── nexus-ai-inventory/
                               ├── manifest.json      ← Different blocks!
                               ├── SecurityAgent.gs   ← Same block, reused
                               ├── Utilities.gs       ← Same block, reused
                               └── InventoryAgent.gs  ← Reused from NexusAI
```

---

## Available Compositions

### 1. gateway-os-prod (Production)

**Purpose:** Full-featured Gateway-OS production deployment
**Blocks:** Security, Router, Utilities, InventoryAgent, LoggerAgent, PatternRegistryAgent
**Files:** 8
**Size:** ~54 KB
**Web App:** Yes
**Use Case:** Production automation platform

```bash
./scripts/compose.sh gateway-os-prod
cd compositions/gateway-os-prod
clasp push
```

### 2. gateway-os-dev (Development)

**Purpose:** Development/testing environment
**Blocks:** Security, Router, Utilities, LoggerAgent, PatternRegistryAgent
**Files:** 7 (no InventoryAgent)
**Size:** ~44 KB
**Web App:** Yes
**Use Case:** Testing new features before prod

```bash
./scripts/compose.sh gateway-os-dev
cd compositions/gateway-os-dev
clasp push
```

### 3. nexus-ai-inventory (NexusAI)

**Purpose:** Standalone inventory management
**Blocks:** Security, Utilities, InventoryAgent
**Files:** 3 (minimal!)
**Size:** ~23 KB
**Web App:** No (trigger-based)
**Use Case:** Drive folder scanning for NexusAI project

```bash
./scripts/compose.sh nexus-ai-inventory
cd compositions/nexus-ai-inventory
clasp push
```

---

## Build System

### How It Works

1. **Define** - Create manifest.json specifying blocks
2. **Build** - Run `compose.sh` to assemble
3. **Deploy** - Use `clasp push` to upload to GAS

### Build Command

```bash
./scripts/compose.sh <composition-name>
```

**What it does:**
1. Reads `manifest.json`
2. Cleans previous build
3. Copies core blocks from `blocks/core/`
4. Copies agent blocks from `blocks/agents/`
5. Copies additional files (Config.gs, etc.)
6. Generates `.clasp.json` with script ID
7. Generates `appsscript.json` with timezone
8. Ready for `clasp push`

---

## Manifest Schema

Every composition has a `manifest.json`:

```json
{
  "composition": {
    "name": "My App",
    "version": "1.0.0",
    "description": "What this does",
    "environment": "production | development"
  },
  "blocks": {
    "core": ["Security", "Router", "Utilities"],
    "agents": ["LoggerAgent", "MyCustomAgent"]
  },
  "additional_files": [
    "Config.gs",
    "Triggers.gs"
  ],
  "clasp": {
    "script_id": "YOUR_GAS_SCRIPT_ID",
    "root_dir": ".",
    "timezone": "America/Chicago"
  },
  "script_properties": {
    "required": ["AUTHORIZED_EMAIL", "SPREADSHEET_ID"],
    "recommended": ["DRIVE_FOLDER_ID"]
  },
  "build": {
    "load_order": [
      "Config.gs",
      "Utilities.gs",
      "SecurityAgent.gs",
      "..."
    ]
  }
}
```

---

## Creating a New Composition

### Step 1: Create Directory

```bash
mkdir -p compositions/my-new-app
```

### Step 2: Create manifest.json

Copy from an existing composition and modify:
- Change `composition.name`
- Update `blocks.core` and `blocks.agents`
- Set `clasp.script_id` (create new GAS project first)
- Define `script_properties.required`

### Step 3: Create README.md

Document:
- Purpose
- Blocks included
- Required Script Properties
- Deployment steps

### Step 4: Build

```bash
./scripts/compose.sh my-new-app
```

### Step 5: Deploy

```bash
cd compositions/my-new-app
clasp push
```

---

## Comparison: Blocks vs Compositions

| Aspect | Blocks | Compositions |
|--------|--------|--------------|
| **Purpose** | Reusable components | Deployable applications |
| **Location** | `blocks/` | `compositions/` |
| **Contents** | Single .gs + docs | Assembled .gs files |
| **Deployment** | Not deployable | Deployable via clasp |
| **Versioning** | Independent | Composed from blocks |
| **Modification** | Edit in blocks/ | Rebuild from blocks/ |

**Key Point:** Never edit .gs files directly in compositions/. Always edit in blocks/, then rebuild.

---

## Workflow

### Development Workflow

```bash
# 1. Edit a block
vim blocks/agents/LoggerAgent/LoggerAgent.gs

# 2. Rebuild affected compositions
./scripts/compose.sh gateway-os-prod
./scripts/compose.sh gateway-os-dev

# 3. Test in dev
cd compositions/gateway-os-dev
clasp push
# Test in Apps Script editor

# 4. Deploy to prod
cd ../gateway-os-prod
clasp push
```

### Update Block Across All Compositions

```bash
# 1. Edit SecurityAgent
vim blocks/core/Security/SecurityAgent.gs

# 2. Rebuild ALL compositions
for comp in gateway-os-prod gateway-os-dev nexus-ai-inventory; do
  ./scripts/compose.sh $comp
done

# 3. Deploy each
cd compositions/gateway-os-prod && clasp push
cd ../gateway-os-dev && clasp push
cd ../nexus-ai-inventory && clasp push
```

---

## Benefits

### ✅ DRY (Don't Repeat Yourself)

Update SecurityAgent once → rebuild all → affects all compositions

### ✅ Flexibility

Mix different blocks for different needs:
- Prod: All features
- Dev: Subset for testing
- NexusAI: Minimal (just inventory)

### ✅ Isolation

Each composition deploys to separate GAS project
Test dev without affecting prod

### ✅ Reusability

NexusAI's InventoryAgent → reused in Gateway-OS prod

### ✅ Traceability

manifest.json documents exactly what's included

---

## File Sizes

| Composition | Files | Size | Blocks |
|-------------|-------|------|--------|
| gateway-os-prod | 8 | ~54 KB | 6 blocks + 2 files |
| gateway-os-dev | 7 | ~44 KB | 5 blocks + 2 files |
| nexus-ai-inventory | 3 | ~23 KB | 3 blocks |

---

## Script Properties

Each composition's manifest.json lists required properties:

### gateway-os-prod

- `AUTHORIZED_EMAIL`
- `SPREADSHEET_ID`
- `ENVIRONMENT`
- `GITHUB_REGISTRY_URL`
- `DRIVE_FOLDER_ID` (optional)

### gateway-os-dev

- `AUTHORIZED_EMAIL`
- `SPREADSHEET_ID`
- `ENVIRONMENT`
- `GITHUB_REGISTRY_URL`

### nexus-ai-inventory

- `AUTHORIZED_EMAIL`
- `SPREADSHEET_ID`
- `ENVIRONMENT`
- `DRIVE_FOLDER_ID`
- `DEPRECATED_DAYS` (optional, default: 90)

---

## Deployment

### Initial Setup

```bash
# 1. Create GAS project in Apps Script console
# 2. Get script ID from URL
# 3. Update manifest.json with script ID
# 4. Build composition
./scripts/compose.sh my-composition

# 5. Deploy
cd compositions/my-composition
clasp push

# 6. Configure Script Properties
# Run in Apps Script editor:
SecurityAgent_setupScriptProperties({...})

# 7. Test
SecurityAgent_runAllTests()
```

### Updates

```bash
# Rebuild and redeploy
./scripts/compose.sh my-composition
cd compositions/my-composition
clasp push
```

---

## Testing

### Test Individual Blocks

```javascript
// In blocks/agents/MyAgent/MyAgent.gs
function MyAgent_test() {
  const result = MyAgent_init({test: "data"});
  Logger.log(result);
}
```

### Test Assembled Composition

```javascript
// In Apps Script editor after clasp push
SecurityAgent_runAllTests()
LoggerAgent_testValid()
PatternRegistryAgent_testSync()
```

---

## Troubleshooting

### Build fails: "Block not found"

**Cause:** manifest.json references non-existent block
**Fix:** Check block name in `blocks/` directory

### clasp push fails: "Script ID not found"

**Cause:** Invalid script_id in manifest.json
**Fix:** Verify script ID in Apps Script console

### Missing functions after deploy

**Cause:** Block not included in manifest.json
**Fix:** Add block to `blocks.core` or `blocks.agents`, rebuild

### Duplicate code

**Cause:** Editing .gs files directly in compositions/
**Fix:** Edit in blocks/, rebuild compositions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-07 | Block composition architecture |
| 1.0.0 | 2026-03-01 | Initial prod/dev projects |

---

## Related Documentation

- `/blocks/README.md` - Agent blocks overview
- `/scripts/compose.sh` - Build script source
- `/templates/` - Reusable templates
- `/SECURITY.md` - Project Sentinel standards

---

**Architecture:** Component-based composition
**Build Tool:** Automated assembly from blocks
**Deployment:** Google Apps Script via clasp
