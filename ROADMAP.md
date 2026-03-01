# AI-Agents / Gateway-OS Roadmap

## Current Status: v1.1 In Progress

### Completed
- [x] Folder structure created
- [x] CLAUDE.md guidelines added
- [x] README documentation written
- [x] Deploy scripts created (ai-agents.sh)
- [x] Git repository initialized
- [x] clasp login for dev account (cary.hebert@gmail.com)
- [x] clasp login for prod account (chebert4@ebrschools.org)
- [x] First Apps Script deployment — dev and prod both live
- [x] Gateway-OS modular architecture: Router.gs, Code.gs, Utilities.gs, Config.gs
- [x] Webhook endpoint with secret guard (doPost)
- [x] updateInventory() with Drive folder scanning
- [x] testSetup() verified in both environments
- [x] Dev → prod deploy flow tested and working
- [x] **Phase 1: CLI upgraded** — `gem` command, docs rewritten for handoff accuracy
- [x] Journal/slides stubs removed from Router.gs (not yet started)

### Next Up
- [ ] Phase 2: Dev modular refactor — `gems/` subfolder, LoggerGem
- [ ] Phase 3: RelocationBridge.py — Drive upload + webhook sync
- [ ] Set DRIVE_FOLDER_ID Script Property in prod, run updateInventory()
- [ ] Tag v1.1-stable

---

## Version History

### v1.1 (In Progress — 2026-03)
- CLI `gem` command added (targets `dev-project/gems/`)
- `CLAUDE.md` and `README.md` rewritten for accurate AI handoffs
- Unstarted Phase 4 (JournalGem) removed from active plan
- Router.gs cleaned of unimplemented stubs

### v1.0 (Complete — 2026-02-27)
- Dev/prod separation working
- Gateway-OS modular architecture deployed
- DB tracking sheets operational
- Webhook routing with secret auth

### v1.2 (Planned)
- CI/CD with GitHub Actions
- RelocationBridge live

### v2.0 (Future)
- Auto-archive after 90 days
- Dashboard for agent status
- Multi-trigger support (time-based + webhook)

---

## Ideas Backlog

- Journal Du Matin — daily Google Slides for students
- Gym tracker shortcut
- Travel logger shortcut
- Daily standup automation
- Email digest generator
- Calendar sync agent
- HSK vocabulary drill shortcut (Shanghai prep)
- **GC-IAM-Auditor** — monthly GCP service account audit, flags accounts inactive >30 days, logs to AI Hub Sheet. Requires GCP staging project + Service Account setup before building. Template saved at `scripts/iam-auditor-notes.md`.

---

Last updated: 2026-03
