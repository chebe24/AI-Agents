# AGENTS.md — Gateway-OS Multi-Agent Workflow Guide

> **Read this at the start of every AI session.**
> It tells you which AI does what, what's safe to touch, and how to hand off work cleanly.

---

## The Golden Rule

**Local repo is always the source of truth.**
Every AI generates text or code. Cary reviews it. Cary commits. No AI pushes to GitHub directly.

```
AI output → Cary reviews in VS Code → git commit → git push
```

---

## Agent Roles

| Agent | Role | What it does in this project |
|-------|------|------------------------------|
| **Claude** | Execution | Reads/writes local files via MCP, edits `.gs`, `.sh`, `.md` files directly |
| **Gemini** | Planning & Architecture | Reviews structure, suggests approaches, drafts specs |
| **ChatGPT** | Development Planning | Pseudocode, logic review, alternative approaches |
| **Perplexity** | Research | Finds libraries, error solutions, best practices — paste snippets as context |

---

## What Each Agent Can and Cannot Do

### Claude
- ✅ Read and write files directly on disk
- ✅ Run terminal commands (via MCP)
- ✅ Edit `.gs`, `.sh`, `.md`, `.json`, `.py` files
- ✅ Check GitHub via browser
- ❌ Do not push to GitHub directly — Cary commits
- ❌ Do not touch `prod-project/` without explicit instruction

### Gemini
- ✅ Review pasted file contents or Google Drive docs
- ✅ Plan architecture and phase structure
- ✅ Draft `CLAUDE.md`, `ROADMAP.md`, `AGENTS.md` updates
- ❌ Cannot access local files — paste relevant content as context
- ❌ Do not generate production code without Claude review

### ChatGPT
- ✅ Logic review, pseudocode, alternative approaches
- ✅ Review pasted file contents
- ❌ Do not use GitHub integration — it bypasses Cary's review
- ❌ Do not generate `.gs` files for direct use without Claude review

### Perplexity
- ✅ Research only — libraries, APIs, error messages, best practices
- ✅ Paste relevant findings into Claude or ChatGPT for implementation
- ❌ No file access, no code generation for direct use

---

## How to Start Any AI Session

### For Claude (current setup)
Claude has direct filesystem access. Start by saying:
> "Read CLAUDE.md and AGENTS.md, then tell me the current project status."

### For Gemini or ChatGPT
Paste these two files at the start of every session:
```bash
cat ~/Documents/02_Projects/AI-Agents/CLAUDE.md
cat ~/Documents/02_Projects/AI-Agents/AGENTS.md
```
Then describe what you want to work on.

### For Perplexity
Paste only the specific context needed for your research question. No need for full project context.

---

## Handoff Protocol (Between AI Sessions)

After every session, update the "Last Session" section at the bottom of this file before closing.
This is your cross-AI memory — none of them share context with each other.

Format:
```
## Last Session
Date    : YYYY-MM-DD
Agent   : Claude / Gemini / ChatGPT / Perplexity
Work    : What was done
Files   : Which files were changed
Next    : What to do next
Commit  : git commit message used
```

---

## Safe Files (Any AI Can Suggest Changes)

| File | Notes |
|------|-------|
| `CLAUDE.md` | AI context — keep current |
| `AGENTS.md` | This file — update after each session |
| `README.md` | Human-facing docs |
| `ROADMAP.md` | Version history and next steps |
| `dev-project/Router.gs` | Add new Gem routes here |
| `dev-project/Config.gs` | Dev constants only |
| `dev-project/gems/*.gs` | New Gem files |
| `scripts/iam-auditor-notes.md` | Planning notes |
| `ai-agents.sh` | CLI tooling |

## Off-Limits Without Explicit Instruction

| File | Reason |
|------|--------|
| `prod-project/*` | Live production — changes affect classroom workflows |
| `dev-project/.clasp.json` | Script ID — wrong value breaks all deployments |
| `prod-project/.clasp.json` | Same — never touch |
| `.gitignore` | Changing this could expose secrets |
| `dev-project/Utilities.gs` | Core shared functions — changes affect everything |

---

## Current Project State (March 2026)

**Phase 1 — Complete ✅**
CLI upgraded, `gem` command added, all docs rewritten and synced to GitHub.

**Phase 2 — Next Up ⏳**
Dev modular refactor — `gems/` subfolder, LoggerGem.

**Phase 3 — Planned ⏳**
RelocationBridge.py — upload PDFs from `30_Administrative/` to Drive, ping prod webhook.

**Active Routes:**
- `fileops` — live in both dev and prod

**Backlog:**
- Journal Du Matin (daily Google Slides)
- GC-IAM-Auditor (monthly GCP audit) — template at `scripts/iam-auditor-notes.md`
- RAG Engine (trilingual standards search) — shelved, files in `scripts/`

---

## Commit Message Convention

```
feat:     New Gem or feature added
refactor: Code restructured, no behavior change
fix:      Bug fixed
docs:     Documentation only
deploy:   Code pushed to GAS (dev or prod)
chore:    Maintenance (cleanup, dependency updates)
```

Examples:
```bash
git commit -m "feat: add RelocationBridge webhook sync"
git commit -m "deploy: push fileops fix to prod"
git commit -m "docs: update AGENTS.md last session"
```

---

## Quick Reference — CLI Commands

```bash
cd ~/Documents/02_Projects/AI-Agents

./ai-agents.sh auth dev            # Check/rotate dev clasp token
./ai-agents.sh auth prod           # Check/rotate prod clasp token
./ai-agents.sh agent <AgentName>   # Scaffold new Agent in dev-project/agents/
./ai-agents.sh deploy dev          # Push dev to GAS
./ai-agents.sh deploy prod         # Push prod to GAS (requires 'yes-prod')
```

---

## Last Session

```
Date    : 2026-03-01
Agent   : Claude
Work    : v1.1 complete — Phase 2 LoggerAgent live and tested, Phase 3 scoped out
          to File Organization project, FilingAgent Hub defined as v2.0 centerpiece,
          agent-hub-research.md saved, ROADMAP.md updated, gcloud installed
Files   : dev-project/agents/LoggerAgent.gs, dev-project/Config.gs,
          dev-project/Router.gs, ROADMAP.md, AGENTS.md,
          scripts/agent-hub-research.md
Next    : v1.2 — CI/CD GitHub Actions, FilingAgent Hub planning
Commit  : feat: v1.1 complete — LoggerAgent, FilingAgent roadmap, hub research saved
```
