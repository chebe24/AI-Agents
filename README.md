# Gateway-OS

**A modular, webhook-based automation system built on Google Apps Script.**

Built by Cary Hebert — 1st Grade French Immersion teacher at BR FLAIM International School,
Baton Rouge, LA. Transitioning to Shanghai High School International Division in August 2026.

---

## What This Is

Gateway-OS is a structured system for building and deploying Google Apps Script automations.
It separates development from production, routes incoming webhook requests to modular Agent
files, and provides a CLI for scaffolding, deploying, and managing the whole system from
your terminal.

---

## Project Structure

```
AI-Agents/
├── ai-agents.sh            # Gateway-OS CLI — your main tool
├── CLAUDE.md               # AI assistant context file
├── ROADMAP.md              # Version history and future plans
├── README.md               # This file
│
├── dev-project/            # Development environment (cary.hebert@gmail.com)
│   ├── Config.gs           # All constants and environment settings
│   ├── Utilities.gs        # Shared helper functions
│   ├── Router.gs           # Webhook entry point — routes actions to Agents
│   ├── Code.gs             # Inventory management logic
│   ├── RelocationTracker.gs  # SHSID onboarding document tracker
│   ├── agents/             # Agent files live here (scaffolded by CLI)
│   ├── .clasp.json         # Clasp config pointing to DEV GAS project
│   └── appsscript.json     # Apps Script manifest
│
├── prod-project/           # Production environment (chebert4@ebrschools.org)
│   ├── Code.gs             # Live production code
│   ├── .clasp.json         # Clasp config pointing to PROD GAS project
│   └── appsscript.json     # Apps Script manifest
│
└── scripts/                # Python utilities (RAG engine, standards embedding)
    ├── standards_embed.py
    ├── query_test.py
    └── requirements.txt
```

---

## Accounts

| Environment | Account                  | Google Sheet              |
|-------------|--------------------------|---------------------------|
| Dev         | cary.hebert@gmail.com    | AI Agents Command Hub     |
| Prod        | chebert4@ebrschools.org  | Agents-Production-Log     |

---

## CLI Reference — `ai-agents.sh`

All commands are run from the project root:
```bash
cd ~/Documents/02_Projects/AI-Agents
```

### Check / Rotate Authentication
```bash
./ai-agents.sh auth dev    # Check dev account (cary.hebert@gmail.com)
./ai-agents.sh auth prod   # Check prod account (chebert4@ebrschools.org)
```
If clasp auth has expired, this re-authenticates and automatically rotates
the GitHub Secret (`CLASDEV_JSON` for dev, `CLASPRC` for prod).

### Scaffold a New Agent
```bash
./ai-agents.sh agent <Name>
```
Example:
```bash
./ai-agents.sh agent Journal
# Creates: dev-project/agents/JournalAgent.gs
```
Every Agent is scaffolded with a standard JSDoc header, an `init()` entry point,
and a private `_process()` stub. After creation, register it in `Router.gs`
(see Adding a New Agent below).

### Deploy
```bash
./ai-agents.sh deploy dev    # Push dev-project/ to GAS (no confirmation needed)
./ai-agents.sh deploy prod   # Push prod-project/ to GAS (requires typing 'yes-prod')
```

---

## Architecture — How a Request Flows

```
External tool (n8n, Make, iOS Shortcut)
        │
        ▼
   doPost() in Router.gs
        │
        ├── Parses JSON payload
        ├── Reads payload.action
        │
        ├── action === "fileops"     → _Router_handleFileOps()
        ├── action === "relocation"  → RelocationTracker (planned)
        └── action === "journal"     → JournalAgent_init()  ← example
```

Every incoming POST request must include an `action` field:
```json
{
  "action": "fileops",
  "fileName": "2026-02-25_Math_Doc_Lesson01.pdf",
  "subjectCode": "Math",
  "status": "uploaded"
}
```

---

## Adding a New Agent (Step by Step)

1. **Scaffold the file:**
   ```bash
   ./ai-agents.sh agent Journal
   ```

2. **Open the generated file** `dev-project/agents/JournalAgent.gs`
   and add your logic inside `_JournalAgent_process(payload)`.

3. **Register the route** in `dev-project/Router.gs`:
   ```javascript
   case "journal":
     return JournalAgent_init(payload);
   ```

4. **Deploy to dev and test:**
   ```bash
   ./ai-agents.sh deploy dev
   ```

5. **When ready, deploy to prod:**
   ```bash
   ./ai-agents.sh deploy prod
   ```

---

## One-Time Setup (New Machine)

```bash
# 1. Install clasp globally
npm install -g @google/clasp

# 2. Authenticate dev account
cd dev-project
clasp login --no-localhost

# 3. Authenticate prod account
cd ../prod-project
clasp login --no-localhost

# 4. Make CLI executable
cd ..
chmod +x ai-agents.sh

# 5. Verify
./ai-agents.sh help
```

---

## Security

- `.env` is excluded from Git — never commit API keys
- `.clasprc.json` is excluded — clasp OAuth tokens
- `WEBHOOK_SECRET` is stored in GAS Script Properties, not in code
- `checkAccount()` in Utilities.gs guards against wrong-account execution
- Production deployment requires typing `yes-prod` to confirm

---

## Current Agent Roster

| Agent File              | Action Key    | Status      |
|-------------------------|---------------|-------------|
| Router.gs (inline)      | `fileops`     | ✅ Live      |
| RelocationTracker.gs    | `relocation`  | 🔧 In Progress |

---

*Last updated: February 2026 — Gateway-OS v1.0*
