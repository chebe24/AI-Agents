# Gateway-OS

**A modular, webhook-based automation system built on Google Apps Script.**

Built by Cary Hebert — 1st Grade French Immersion teacher at BR FLAIM International School,
Baton Rouge, LA. Transitioning to Shanghai High School International Division in August 2026.

---

## What This Is

Gateway-OS receives POST requests from external tools (iOS Shortcuts, n8n, Make, curl),
routes them to self-contained automation modules called Agents, and logs all activity
to Google Sheets. Two fully separate GAS projects keep development and production isolated.

---

## Project Structure

```
AI-Agents/
├── ai-agents.sh            ← Gateway-OS CLI (auth / agent / deploy)
├── CLAUDE.md               ← AI assistant context file (read this first)
├── AGENTS.md               ← Multi-agent workflow guide
├── ROADMAP.md              ← Version history and next steps
│
├── dev-project/            ← Development environment (cary.hebert@gmail.com)
│   ├── Config.gs           ← All constants: ENV, SPREADSHEET_ID, etc.
│   ├── Utilities.gs        ← Shared helpers: checkAccount, logEvent, buildResponse
│   ├── Router.gs           ← Webhook entry point — routes action → Agent
│   ├── Code.gs             ← Inventory management (updateInventory)
│   ├── RelocationTracker.gs← SHSID onboarding document tracker
│   └── agents/             ← Agent files (auto-scaffolded by CLI)
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

### Scaffold a New Agent
```bash
./ai-agents.sh agent <AgentName>
```
Example:
```bash
./ai-agents.sh agent Journal
# Creates: dev-project/agents/JournalAgent.gs
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

Every Agent returns a standard JSON envelope:
```json
{ "code": 200, "message": "...", "errors": [], "env": "development" }
```

---

## Adding a New Agent (Step by Step)

1. **Scaffold the file:**
   ```bash
   ./ai-agents.sh agent MyAgent
   ```

2. **Open** `dev-project/agents/MyAgentAgent.gs` and add logic inside `_MyAgentAgent_process(payload)`.

3. **Register the route** in `dev-project/Router.gs`:
   ```javascript
   case "myagent":
     return MyAgentAgent_init(payload);
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

## Current Agent Roster

| Agent File                  | Action Key   | Status          |
|-----------------------------|--------------|-----------------|
| Router.gs (inline handler)  | `fileops`    | ✅ Live         |
| RelocationTracker.gs        | `relocation` | 🔧 In Progress  |

---

## Current Phase Status

| Phase | Description                                       | Status       |
|-------|---------------------------------------------------|--------------|
| 1     | CLI Tooling (`ai-agents.sh`)                      | ✅ Complete  |
| 2     | LoggerAgent + System Log sheet                    | ✅ Complete  |
| 3     | AI-Logbook Pipeline (ChatLogs + ProdLog)          | ✅ Complete  |
| 4     | OCR Pipeline (Docker + hazel_ocr_bridge.sh v4.0)  | ✅ Complete  |
| 5     | FilingAgent Hub (NamingAgent, OrganizerAgent)     | ⏳ Planned   |

---

## OCR Pipeline

Scanned documents dropped into `ScannedInbox/` are automatically processed:

```
ScannedInbox/ → Docker OCRmyPDF → Apps Script POST → ProdLog
```

**Routing rules:**
- Math / M# subject codes → `33_Math/` + FLAIM Shared Drive copy
- Mandarin → `41_Mandarin/` (personal)
- Admin → `30_Administrative/`
- No match → `00_Inbox/Quarantine`

Language packs: `eng + chi_sim`

---

*Last updated: 2026-03-01 — Gateway-OS v1.2*
