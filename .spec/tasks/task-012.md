---
task: 012
feature: lazy-context-filtering-mcp
status: pending
depends_on: [008, 010, 011]
---

# Task 012: Dashboard REST API

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, api-design, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement Express REST API endpoints for the dashboard: server status, context management, session listing, config, and analytics.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Dashboard API runs on port 3000 within the same TS process as the MCP server.
- Config changes apply immediately (in-memory config object).

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Implement `src/server/api.ts`:
   - `GET /api/status` — return `{ uptime, contextCount, activeSessions, engineHealth }`.
   - `GET /api/context` — paginated list of context items with metadata.
   - `DELETE /api/context/:id` — remove a context item, invalidate cache.
   - `GET /api/sessions` — list active sessions.
   - `GET /api/config` — return current server config (thresholds, TTL, defaults).
   - `PUT /api/config` — update config, apply immediately.
   - `GET /api/analytics` — token usage stats per session.
2. Mount Express app in `src/server/index.ts` on port 3000.
3. Write integration tests using supertest for all endpoints.

_Requirements: 9.1, 9.2, 9.3, 9.4_
_Skills: code-writing-software-development, api-design, tdd-workflow_

---

## Acceptance Criteria
- [ ] All 6 REST endpoints return correct data
- [ ] Config updates apply immediately
- [ ] Context deletion invalidates cache
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
