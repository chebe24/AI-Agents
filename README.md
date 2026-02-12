# AI-Agents Workflow System

Multi-account (dev/prod) Apps Script + iOS Shortcuts for AI automations. Tracks in Sheets DB.

## Quick Start

1. `npm i -g @google/clasp`
2. Edit emails in deploy.sh: dev@yourdomain.com, prod@yourdomain.com
3. `./clasp-setup.sh`
4. `./deploy.sh dev` → code/edit
5. `./deploy.sh prod` → deploy/execute

## Structure

| Folder | Purpose |
|--------|---------|
| `dev-project/` | Apps Script development via clasp |
| `prod-project/` | Production Apps Script deployment |
| `active/` | iOS Shortcuts exports (iCloud share to prod iPhone) |
| `db/` | Sheets inventory backups |
| `deprecated/` | Old workflows pending deletion |
| `archive/` | Long-term storage by year |
| `scripts/` | Utility scripts |

## DB Schema (Google Sheets: AI_Agents_Inventory)

| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Name | Agent/workflow name |
| Ecosystem | iOS / Apps Script / Hybrid |
| Status | Active / Deprecated / Archive |
| Git | GitHub repo link |
| Drive Path | Google Drive location |
| PII_Level | None / Low / High |
| Last Updated | Timestamp |

## Deploy Flow

```
dev → Git tag → clasp push prod → Webapp URL to DB → Prod triggers run
```

## Security

- **Prod execution**: `Execute as: Me (dev)`, `Access: Anyone`
- **Account check**: checkAccount() in Code.gs prevents wrong-account execution
- **No secrets committed**: API keys in Script Properties only

## Adding New Agents

1. Create `active/agent-name/` with `.shortcut` + `prompt.md`
2. Update DB row in AI_Agents_Inventory
3. Deploy prod changes: `./deploy.sh prod`
4. Git commit: `feat: Add agent-name workflow`

## Commands Reference

| Task | Command |
|------|---------|
| Deploy to dev | `./deploy.sh dev` |
| Deploy to prod | `./deploy.sh prod` |
| Check clasp status | `clasp status --user dev@yourdomain.com` |
| List active agents | `ls active/` |
| Cleanup old files | `find deprecated/ -mtime +90 -delete` |
| Archive by year | `mv deprecated/* archive/$(date +%Y)/` |

## Troubleshooting

**clasp login fails**: Clear credentials with `clasp logout` then retry

**Wrong account executing**: Check `checkAccount()` in Code.gs matches expected email

**Push rejected**: Run `clasp pull` first to sync, resolve conflicts

---

Built with Claude Code. Edit CLAUDE.md for agent guidelines.
