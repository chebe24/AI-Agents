# AI Agent Hub — Architecture Research Notes

> Saved for v2.0 FilingAgent Hub planning.
> Source: AI Agent Hub Best Practices research, March 2026.
> Do not implement until v1.1 is stable and FilingAgent scope is defined.

---

## Key Takeaways for Gateway-OS v2.0

### What Gateway-OS Already Gets Right
- Router.gs acts as the orchestrator/supervisor
- Individual Agents (LoggerAgent, RelocationTracker) act as workers
- Structured JSON payloads match the "manager-worker communication" pattern
- Single-responsibility per Agent file matches best practices

### Recommended Architecture for FilingAgent Hub

Use a **hierarchical supervisor model** — Router receives the request, delegates
to the appropriate worker Agent, aggregates results, logs via LoggerAgent.

```
iOS Shortcut / n8n / curl
        │  POST { "action": "filing", "context": "relocation", ... }
        ▼
  Router.gs (supervisor)
        │
        ├── NamingAgent    — validate/correct filename
        ├── OrganizerAgent — route to correct Drive folder
        ├── ArchiveAgent   — flag/move old files
        └── RecordsAgent   — log action to sheet
```

### Planned Worker Agents

| Agent | Single Responsibility |
|---|---|
| `NamingAgent` | Validates and corrects filenames against FLAIM convention |
| `OrganizerAgent` | Routes files to correct Drive folders by subject/type |
| `ArchiveAgent` | Flags and moves old or completed files |
| `RecordsAgent` | Maintains tracking sheet log of all file actions |

### Framework Decision
**Skip CrewAI and LangGraph for now.** They are Python-based and add significant
complexity for a solo developer. Google Apps Script + webhook pattern is already
production-ready. Add framework complexity only when GAS genuinely cannot handle
the task (e.g., LLM-based filename suggestions, semantic search).

### Patterns to Use
- **Sequential** for linear filing tasks (name → organize → log)
- **Shared context object** passed through the chain so each Agent knows what the previous one did
- **LoggerAgent** called at the end of every chain for observability

### When to Consider Python/LangChain
- When filename validation needs LLM suggestions (not just rules)
- When semantic search over file contents is needed (RAG Engine)
- When agents need to reason about ambiguous file types

---

## Original Research Summary

An AI agent hub features a central project manager AI (orchestrator/supervisor)
that interprets user queries, delegates tasks to specialized worker agents, and
synthesizes results. Key principles:

- Hierarchical design with supervisor-led routing
- Single-responsibility worker agents with scoped tools
- Structured JSON payloads between manager and workers
- Observability via logging at every step
- Start small, pilot single workflow, iterate

Recommended frameworks for production: CrewAI or LangGraph for complex flows.
For Gateway-OS scale: native GAS pattern is sufficient through v2.0.
