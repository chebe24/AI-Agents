# CLAUDE.md — AI-Agents Project Context

> **For AI assistants (Claude, Gemini, etc.):** Read this first. It tells you exactly what this project is, how it's structured, and how to help without breaking things.

---

## Who Built This

**Cary Hebert** — 1st Grade French Immersion teacher, BR FLAIM International School, Baton Rouge, LA (EBRPSS).  
Transitioning to Shanghai High School International Division, August 2026.  
HSK 4 Mandarin in progress. 20+ years GitHub experience. Prefers no-code solutions.

---

## What This Project Is

A dual-account Google Apps Script + iOS Shortcuts automation system with:
1. **Apps Script Web Apps** — receive webhook calls from iOS Shortcuts, log to Google Sheets
2. **Trilingual RAG Engine** — semantic search over educational standards (English/French/Mandarin) using Google's free embedding API + Chroma vector DB
3. **Deploy scripts** — bash automation for pushing to dev vs. prod

---

## Two Google Accounts

| Role | Email | Use |
|------|-------|-----|
| Dev | cary.hebert@gmail.com | Coding, testing, personal |
| Prod | chebert4@ebrschools.org | Live classroom, school use |

**IMPORTANT:** Never mix these. Always verify with `checkAccount()` before running anything in production.

---

## Folder Structure

```
AI-Agents/
├── README.md               # Project overview
├── ROADMAP.md              # Version history
├── CLAUDE.md               # This file
├── .gitignore              # Excludes .env, .clasprc.json, db/ exports
├── appsscript.json         # Apps Script manifest (timeZone: America/Chicago)
├── clasp-setup.sh          # Run once: creates dev + prod clasp projects
├── deploy.sh               # ./deploy.sh dev OR ./deploy.sh prod
├── scripts/
│   └── Code.gs             # Main Apps Script (dev config)
├── Dev/                    # Google Cloud security notes
├── standards_raw/          # Source PDFs/CSVs for embedding
├── standards_embed.py      # Embedding script → Chroma DB
├── query_test.py           # Test vector search
├── test_env.py             # Verify GOOGLE_API_KEY in .env
├── process_math_lp.py      # Eureka Math² lesson plan processor
└── requirements.txt        # Python deps
```

---

## Ground Rules for AI Assistants

1. **Explain at 5th-grade level** — Cary is technically literate but prefers plain English
2. **No-code first** — Suggest GUI/no-code options before writing scripts
3. **Confirm before deleting or overwriting** — Always ask before `rm` or `cp` that would overwrite
4. **Conventional commits** — Use format: `type: message` (e.g., `deploy: push dev 2026-02-22`)
5. **FERPA matters** — Never include real student names, grades, or IDs in code or commits
6. **Step-by-step** — Break multi-step tasks into numbered steps with explanation for each
7. **Check accounts** — Always confirm which Google account is active before clasp operations

---

## Script IDs

| Environment | Script ID | Account |
|-------------|-----------|--------|
| Dev | `1o_3FUWvqXzFYeJOParcxBYcAacZy5Ig3MbgbTAX5TCixKrrchW7IBOBW` | cary.hebert@gmail.com |
| Prod | TBD | chebert4@ebrschools.org |

---

## Current Status (February 2026)

- ✅ Repo structure cleaned up
- ✅ Dev `Code.gs` with `checkAccount()`, `doGet()`, `doPost()`, logging to Sheet
- ✅ `appsscript.json` configured for Chicago timezone
- ✅ RAG engine scripts in place
- ⏳ `clasp login` for both accounts pending
- ⏳ First live deployment to dev pending
- ⏳ AI_Agents_Inventory Google Sheet not yet created

---

## How to Deploy (Quick Reference)

```bash
# First time only
./clasp-setup.sh

# Every time you make changes
./deploy.sh dev       # Safe: pushes to dev Apps Script
./deploy.sh prod      # Asks for confirmation first

# Then commit
git add .
git commit -m "deploy: update dev 2026-02-22"
git push
```

---

## Python RAG Engine (Quick Reference)

```bash
pip install -r requirements.txt
echo "GOOGLE_API_KEY=your_key" > .env
python test_env.py            # Verify key works
# Drop files in standards_raw/
python standards_embed.py     # Build vector DB
python query_test.py          # Test queries
```

---

## Success Criteria for v1.0

- `curl [prod-deploy-url]` returns `{"status":"ok","environment":"production"}`
- Dev and prod Apps Scripts are separate projects in separate Google accounts
- At least one iOS Shortcut can POST to prod URL and get a response
- Git history is clean with conventional commits
