# AI-Agents

**A dual-account Google Apps Script + iOS Shortcuts automation system for teaching and personal productivity.**

Built by Cary Hebert — 1st Grade French Immersion teacher at BR FLAIM International School, Baton Rouge, LA. Transitioning to Shanghai High School International Division in August 2026.

---

## What This Does

This repo manages a webhook-based AI agent system that:
- Receives requests from iOS Shortcuts via Google Apps Script web apps
- Separates **development** (cary.hebert@gmail.com) from **production** (chebert4@ebrschools.org)
- Logs activity to Google Sheets
- Supports educational automation workflows (lesson plans, standards lookup, etc.)
- Includes a Trilingual Standards RAG Engine (English/French/Mandarin) using Google's free embedding API + Chroma

---

## Folder Structure

```
AI-Agents/
├── README.md               # This file
├── ROADMAP.md              # Version history and goals
├── CLAUDE.md               # AI assistant bootstrap instructions
├── .gitignore              # Security: excludes .env, credentials
├── appsscript.json         # Apps Script manifest
├── clasp-setup.sh          # One-time setup: creates dev + prod projects
├── deploy.sh               # Deploy to dev or prod
├── scripts/
│   └── Code.gs             # Main Apps Script code (dev version)
├── Dev/
│   ├── GC-IAM-Auditor-README.md
│   └── GoogleCloud-Credentials-Security.md
├── standards_raw/          # Drop PDFs/CSVs here for RAG embedding
├── standards_embed.py      # Embeds documents into Chroma vector DB
├── query_test.py           # Test semantic queries
├── test_env.py             # Verify .env API key setup
├── process_math_lp.py      # Math lesson plan processor
└── requirements.txt        # Python dependencies
```

---

## Quick Start

### Apps Script (clasp)

```bash
# 1. Install clasp
npm install -g @google/clasp

# 2. One-time setup (creates dev + prod projects)
./clasp-setup.sh

# 3. Deploy
./deploy.sh dev    # Push to development
./deploy.sh prod   # Push to production (asks confirmation)
```

### RAG Engine (Python)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Add your Google API key
echo "GOOGLE_API_KEY=your_key_here" > .env

# Test setup
python test_env.py

# Drop PDFs/CSVs into standards_raw/, then embed
python standards_embed.py

# Run test queries
python query_test.py
```

---

## Accounts

| Environment | Account | Purpose |
|-------------|---------|---------|
| Dev | cary.hebert@gmail.com | Coding, testing |
| Prod | chebert4@ebrschools.org | Live classroom use |

---

## Security

- `.env` is excluded from Git (never commit API keys)
- `.clasprc.json` is excluded (clasp credentials)
- `db/` CSV exports are excluded (may contain student data — FERPA)
- Account verification built into `Code.gs` via `checkAccount()`

---

## Related Projects

- **Nexus AI** — AI teaching coach system
- **Maître** — AI art instructor using classical atelier methods
- **FLAIM File Naming Convention v5.0** — cross-platform file organization standard

---

*Last updated: February 2026*
