# Gateway-OS

**A modular, webhook-based automation system built on Google Apps Script.**

Built by Cary Hebert — 1st Grade French Immersion teacher at BR FLAIM International School,
Baton Rouge, LA. Transitioning to Shanghai High School International Division in August 2026.

---

## What This Is

Gateway-OS receives POST requests from external tools (iOS Shortcuts, n8n, Make, curl),
routes them to self-contained automation modules called "Gems," and logs all activity
to Google Sheets. Two fully separate GAS projects keep development and production isolated.

---

## Project Structure

```
AI-Agents/
├── ai-agents.sh            ← Gateway-OS CLI (auth / gem / deploy)
├── CLAUDE.md               ← AI assistant context file (read this first)
├── ROADMAP.md              ← Version history and next steps
│
├── dev-project/            ← Development environment (cary.hebert@gmail.com)
│   ├── Config.gs           ← All constants: ENV, SPREADSHEET_ID, etc.
│   ├── Utilities.gs        ← Shared helpers: checkAccount, logEvent, buildResponse
│   ├── Router.gs           ← Webhook entry point — routes action → Gem
│   ├── Code.gs             ← Inventory management (updateInventory)
│   ├── RelocationTracker.gs← SHSID onboarding document tracker
│   └── gems/               ← Gem files (auto-scaffolded by CLI)
│
├── prod-project/           ← Production environment (chebert4@ebrschools.org)
│   ├── Config.gs
│   ├── Utilities.gs
│   ├── Router.gs
│   └── Code.gs
│
└── scripts/                ← Python utilities (RAG / standards embedding)
```

---

## Accounts & Environments

| Environment | Account                  | Google Sheet              |
|-------------|--------------------------|---------------------------|
| Dev         | cary.hebert@gmail.com    | AI Agents Command Hub     |
| Prod        | chebert4@ebrschools.org  | Agents-Production-Log     |

**Never mix these.** `checkAccount()` in Utilities.gs will throw an error if the wrong account is active.

---

## CLI Reference — `ai-agents.sh`

All commands run from the project root:

```bash
cd ~/Documents/02_Projects/AI-Agents
```

### Check / Rotate Authentication
```bash
./ai-agents.sh auth dev    # Check dev (cary.hebert@gmail.com)
./ai-agents.sh auth prod   # Check prod (chebert4@ebrschools.org)
```
If clasp auth has expired, this re-authenticates and automatically rotates
the corresponding GitHub Secret (`CLASDEV_JSON` for dev, `CLASPRC` for prod).

### Scaffold a New Gem
```bash
./ai-agents.sh gem <GemName>
```
Example:
```bash
./ai-agents.sh gem Journal
# Creates: dev-project/gems/JournalGem.gs
```

### Deploy
```bash
./ai-agents.sh deploy dev    # Push dev-project/ to GAS (immediate)
./ai-agents.sh deploy prod   # Push prod-project/ to GAS (requires typing 'yes-prod')
```

---

## Architecture — How a Request Flows

```
External tool (iOS Shortcut, n8n, Make, curl)
        │  POST {"action": "fileops", "fileName": "...", ...}
        ▼
  Router.gs → doPost()
        │
        ├── Parses JSON body
        ├── Reads payload.action
        │
        └── "fileops"  → _Router_handleFileOps(payload)
```

Every Gem returns a standard JSON envelope:
```json
{ "code": 200, "message": "...", "errors": [], "env": "development" }
```

---

## Adding a New Gem (Step by Step)

1. **Scaffold the file:**
   ```bash
   ./ai-agents.sh gem MyGem
   ```

2. **Open** `dev-project/gems/MyGemGem.gs` and add logic inside `_MyGemGem_process(payload)`.

3. **Register the route** in `dev-project/Router.gs`:
   ```javascript
   case "mygem":
     return MyGemGem_init(payload);
   ```

4. **Deploy and test:**
   ```bash
   ./ai-agents.sh deploy dev
   ```

5. **When ready:**
   ```bash
   ./ai-agents.sh deploy prod
   ```

---

## One-Time Setup (New Machine)

```bash
npm install -g @google/clasp
cd dev-project && clasp login --no-localhost
cd ../prod-project && clasp login --no-localhost
cd .. && chmod +x ai-agents.sh
./ai-agents.sh help
```

---

## Security

- `.env` and `.clasprc.json` are excluded from Git
- `WEBHOOK_SECRET` is stored in GAS Script Properties, not in code
- `checkAccount()` guards against wrong-account execution
- Production deployment requires typing `yes-prod` to confirm

---

## Current Gem Roster

| Gem File                    | Action Key  | Status          |
|-----------------------------|-------------|-----------------|
| Router.gs (inline handler)  | `fileops`   | ✅ Live         |
| RelocationTracker.gs        | `relocation`| 🔧 In Progress  |

---

## Current Phase Status

| Phase | Description                      | Status       |
|-------|----------------------------------|--------------|
| 1     | CLI Tooling (`ai-agents.sh`)     | ✅ Complete  |
| 2     | Dev Environment Refactor (gems/) | ⏳ Planned   |
| 3     | Python RelocationBridge          | ⏳ Planned   |

---

*Last updated: March 2026 — Gateway-OS v1.1*
