# CLAUDE.md: Complete AI-Agents Project Bootstrap

## Mission
Set up the full multi-account Apps Script + iOS Shortcuts AI workflow system from scratch. Use dev@yourdomain.com (coding) and prod@yourdomain.com (execution). Sync to ~/AI-Agents/ Drive folder. Prioritize safety: no PII, verify accounts.

## Step-by-Step Execution (Run Sequentially)

### 1. Verify/Install Tools
- Check Node/npm: `node -v` (v20+), `npm -g i @google/clasp`
- Login clasp: `clasp login --user dev@yourdomain.com` then `--user prod@yourdomain.com`
- Git init if missing

### 2. Folder Structure (exact)
```
AI-Agents/
├── README.md
├── ROADMAP.md
├── CLAUDE.md (this file)
├── deploy.sh
├── clasp-setup.sh
├── .gitignore
├── dev-project/
│   ├── .clasp.json
│   ├── appsscript.json
│   └── Code.gs
├── prod-project/ (copy from dev after first push)
├── active/
├── db/
├── deprecated/
├── archive/
└── .git/
```

### 3. Run Setup
```bash
./clasp-setup.sh
./deploy.sh dev  # Pull/push to dev
cp -r dev-project prod-project
# Edit prod .clasp.json with prod scriptId
./deploy.sh prod
```

### 4. DB Integration
- Create Sheets "AI_Agents_Inventory" with schema
- Add update-db.gs to scripts/: scan Drive, flag deprecated

### 5. Test & Deploy
- `./deploy.sh dev`: Edit Code.gs, push, verify editor
- `./deploy.sh prod`: Deploy webapp, test URL as prod account
- Git commit/tag v1.0

### 6. Cleanup/Verify
- No PII in code; add checkAccount()
- Git push origin main

## Preferences
- Explain each step (5th grade)
- No assumptions—confirm before rm/cp
- Conventional commits
- If error, debug with `clasp status --user $ENV`

## Success Criteria
- `curl prod-deploy-url` returns "Prod ready"
- Structure matches exactly
- Ready for iOS Shortcuts links in active/
