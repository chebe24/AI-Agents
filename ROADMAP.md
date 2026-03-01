# AI-Agents / Gateway-OS Roadmap

## Current Status: v1.1 Complete ✅

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
- [x] **Phase 1: CLI upgraded** — `agent` command, docs rewritten for handoff accuracy
- [x] Journal/slides stubs removed from Router.gs
- [x] "Gem" terminology replaced with "Agent" across all files
- [x] **Phase 2: agents/ subfolder created, LoggerAgent live, System Log sheet working**
- [x] Phase 3: RelocationBridge — moved to File Organization project (better fit)
- [x] Tag v1.1-stable

---

## Version History

### v1.1 (Complete — 2026-03)
- CLI `agent` command added (targets `dev-project/agents/`)
- "Gem" terminology replaced with "Agent" across all files
- `CLAUDE.md`, `README.md`, `AGENTS.md` rewritten for accurate AI handoffs
- Router.gs cleaned of unimplemented stubs
- `agents/` subfolder created — modular Agent pattern established
- LoggerAgent deployed — color-coded System Log sheet live
- RelocationBridge scoped out — belongs in File Organization project
- gcloud CLI installed and authenticated
- AGENTS.md created — multi-agent workflow guide with Last Session tracking

### v1.0 (Complete — 2026-02-27)
- Dev/prod separation working
- Gateway-OS modular architecture deployed
- DB tracking sheets operational
- Webhook routing with secret auth

---

## v1.2 — Next Track (Planned)

### FilingAgent Hub (v2.0 centerpiece)
A personal filing assistant that keeps files named correctly, organized in the right
folders, and maintains active/archive status. Based on hub architecture research
saved at `scripts/agent-hub-research.md`.

Planned worker Agents:
- **NamingAgent** — validates and corrects filenames against FLAIM convention
- **OrganizerAgent** — routes files to correct Drive folders by subject/type
- **ArchiveAgent** — flags and moves old or completed files
- **RecordsAgent** — maintains tracking sheet log of all file actions

Router.gs will act as the supervisor, chaining workers as needed.

### Other v1.2 Items
- [ ] CI/CD with GitHub Actions — auto-deploy on push to main
- [ ] Set DRIVE_FOLDER_ID Script Property in prod, run updateInventory()
- [ ] RelocationTracker — wire into FilingAgent as a context ("relocation")

---

## v2.0 (Future)
- FilingAgent Hub fully operational
- Auto-archive after 90 days
- Dashboard for agent status
- Multi-trigger support (time-based + webhook)
- HSK vocabulary drill Agent (Shanghai prep)

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
