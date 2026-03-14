# CLAUDE.md

> This file exists so Claude (and Claude Code / Cowork) auto-loads project context.
> **All actual project information lives in AGENTCONTEXT.md — read that file first and in full.**

---

## Who Built This

**Cary Hebert** — 1st Grade French Immersion teacher, BR FLAIM International School, Baton Rouge, LA (EBRPSS).
Transitioning to Shanghai High School International Division, **August 2026**.
HSK 4 Mandarin in progress. 20+ years GitHub experience. Prefers plain English and no-code solutions.

---

## What This Project Is

**Gateway-OS** is a modular, webhook-based automation system built on Google Apps Script (GAS).
It receives POST requests from external tools (n8n, Make, iOS Shortcuts), routes them to
self-contained Agent handlers, and logs results to Google Sheets.

There are two fully separate GAS projects:

| Environment | Account                  | Google Sheet          | Sheet ID |
|-------------|--------------------------|-----------------------|----------|
| Dev         | cary.hebert@gmail.com    | AI Agents Command Hub | `1KVHxSLUSk1LpySX2K1ITRXqxJKV4h-dpnd_Ia4lV6_E` |
| Prod        | cary.hebert@gmail.com    | AI_Agents_Command_Hub | `1kWtc6Z_kdgCEMCkYyLd9U300MGxdZLr0NzNSESIUsUE` |

---

## Actual Folder Structure (as of March 2026)

```
AI-Agents/                          ← Git repo root
├── ai-agents.sh                    ← Gateway-OS CLI (auth / agent / deploy)
├── deploy.sh                       ← Legacy deploy script (kept for reference)
├── CLAUDE.md                       ← This file
├── AGENTS.md                       ← Multi-agent workflow guide
├── README.md                       ← Human-facing project overview
├── ROADMAP.md                      ← Version history and next steps
├── .gitignore                      ← Excludes .env, .clasprc.json
│
├── dev-project/                    ← Development GAS project
│   ├── .clasp.json                 ← Points to DEV script ID
│   ├── appsscript.json             ← Manifest (timeZone: America/Chicago)
│   ├── Config.gs                   ← All constants (ENV, ACCOUNT, SPREADSHEET_ID)
│   ├── Utilities.gs                ← Shared helpers (checkAccount, logEvent, etc.)
│   ├── Router.gs                   ← doGet / doPost — routes action → Agent
│   ├── Code.gs                     ← Inventory management (updateInventory)
│   ├── RelocationTracker.gs        ← SHSID onboarding document tracker (in progress)
│   └── agents/                     ← Agent files live here (auto-created by CLI)
│
├── prod-project/                   ← Production GAS project
│   ├── .clasp.json                 ← Points to PROD script ID
│   ├── appsscript.json
│   ├── Config.gs
│   ├── Utilities.gs
│   ├── Router.gs
│   └── Code.gs
│
└── scripts/                        ← SHELVED — do not modify or build on these
    ├── standards_embed.py          ← RAG engine (shelved, not a priority)
    ├── query_test.py               ← RAG engine (shelved)
    ├── test_env.py                 ← RAG engine (shelved)
    ├── iam-auditor-notes.md        ← GC-IAM-Auditor planning notes (backlog)
    └── requirements.txt            ← RAG engine (shelved)
```

**Important:** There is no `scripts/Code.gs`. GAS files live inside `dev-project/` and `prod-project/` only.

> **Note on `scripts/`:** The Python RAG engine (Chroma vector DB, trilingual standards embedding)
> has been shelved and is not a current priority. Do not suggest building on or extending these files.
> They are kept for potential future reference only.

---

## Script IDs & Web App URLs

| Env  | GAS Script ID | Web App URL |
|------|---------------|-------------|
| Dev  | `1o_3FUWvqXzFYeJOParcxBYcAacZy5Ig3MbgbTAX5TCixKrrchW7IBOBW` | https://script.google.com/macros/s/AKfycbxC3q2qNHivWzRpvLZdWnH8r5uuDTUTPn-NtPG_3g2lC6Gy1ErDiDZoGzJ_LSIp-_Z6mQ/exec |
| Prod | `1Znk2rEPszw359bPAaxzVORGSOTby1vFNYp2oMR2N93lMb6Vo_gd9auib` | (deploy to get new URL — run ./ai-agents.sh deploy prod) |

GitHub Secrets:
- `CLASDEV_JSON` — clasp OAuth token for dev account
- `CLASPRC` — clasp OAuth token for prod account

---

## Architecture — How a Request Flows

```
External trigger (iOS Shortcut, n8n, Make, curl)
        │  POST { "action": "fileops", ... }
        ▼
  Router.gs → doPost()
        │
        ├── Validates secret (prod only)
        ├── Parses JSON payload
        ├── Reads payload.action
        │
        └── "fileops"  → _Router_handleFileOps(payload)
```

Every Agent returns `buildResponse(code, message, data?)` — a standard JSON envelope.

---

## Current Status (March 2026)

### ✅ Complete
- Dev/prod separation deployed and tested
- Gateway-OS Router pattern live in both environments
- `ai-agents.sh` CLI: `auth`, `agent`, `deploy` commands
- `fileops` webhook route working
- `updateInventory()` Drive scan function
- Router.gs cleaned — no unimplemented stubs

### ✅ Complete (continued)
- **Phase 2** — Dev modular refactor (agents/ subfolder, LoggerAgent)
- **Phase 3** — RelocationBridge.py (Python → Drive upload → Webhook)
- **ModelRouterAgent** — Gemini + Claude routes active. ChatGPT + Perplexity pending API keys.

### 🚫 Shelved
- **RAG Engine** — Python / Chroma vector DB / trilingual standards embedding (not a priority)

### ⏳ Ideas Backlog
- Journal Du Matin — daily Google Slides automation
- GC-IAM-Auditor — monthly GCP service account audit (template in scripts/)

---

## Ground Rules for AI Assistants

1. **Apply step by step logic** — think logically and provide evidence from research sources or user context.
2. **No-code first** — suggest GUI options before writing code
3. **Confirm before destructive actions** — never overwrite without asking
4. **Conventional commits** — format: `type: message` (e.g., `feat: add LoggerAgent`)
5. **FERPA** — never include real student names, grades, or IDs anywhere
6. **Check accounts** — always confirm which Google account is active before clasp operations
7. **Phase-by-phase** — output one phase at a time, wait for confirmation before the next
8. **Never guess at outputs** - if you have insufficient data or context to make a decision, do not guess. Instead, ask for more information.
9. **Code lives in GitHub only** — never save code files to local folders or Google Drive. All `.gs`, `.sh`, `.py`, `.js`, and config files belong in the GitHub repo and nowhere else.
---

## CLI Quick Reference

```bash
cd ~/Developer.nosync/nexus-command

./ai-agents.sh auth dev            # Verify dev token, auto-rotate GitHub Secret if expired
./ai-agents.sh auth prod           # Same for prod
./ai-agents.sh agent Journal       # Scaffold dev-project/agents/JournalAgent.gs
./ai-agents.sh deploy dev          # Push dev-project/ to GAS
./ai-agents.sh deploy prod         # Push prod-project/ (requires typing 'yes-prod')
```

---

## Future Addition: Trilingual RAG Engine

> **Status: Not started. Do not implement unless Cary explicitly asks.**

A planned semantic search engine over educational standards in English, French, and Mandarin.
Files already exist in `scripts/` but are not connected to Gateway-OS yet.

| File | Purpose |
|------|---------|
| `scripts/standards_embed.py` | Embeds standards PDFs/CSVs into a Chroma vector DB |
| `scripts/query_test.py` | Tests semantic queries against the DB |
| `scripts/test_env.py` | Verifies `GOOGLE_API_KEY` is set in `.env` |
| `standards_raw/` | Source PDFs/CSVs to be embedded |

When active, it will use Google's free embedding API and requires a `GOOGLE_API_KEY` in a local `.env` file (never committed to Git).
