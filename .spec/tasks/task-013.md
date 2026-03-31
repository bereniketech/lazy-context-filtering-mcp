---
task: 013
feature: lazy-context-filtering-mcp
status: pending
depends_on: [012]
---

# Task 013: React Dashboard Frontend

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Build a React SPA dashboard for monitoring and configuring the MCP server. Displays status, context items, sessions, config editor, and token analytics.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Vite + React + TypeScript.
- Connects to REST API on port 3000.
- Deployed to Vercel.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Scaffold `src/dashboard/` with Vite React-TS template.
2. Create API client (`src/dashboard/src/api.ts`) connecting to `/api/*` endpoints.
3. Build pages:
   - **Status**: server uptime, context count, active sessions, engine health indicator.
   - **Context**: searchable/filterable table of context items with metadata, delete action.
   - **Sessions**: list of active sessions with query history.
   - **Config**: form editor for threshold, token budget default, cache TTL. Save button calls `PUT /api/config`.
   - **Analytics**: token usage chart per session (bar or line chart).
4. Add routing (React Router) and navigation.
5. Style with Tailwind CSS or minimal CSS.
6. Write component tests for key interactions.

_Requirements: 9.1, 9.2, 9.3, 9.4_
_Skills: code-writing-software-development, tdd-workflow_

---

## Acceptance Criteria
- [ ] Dashboard displays server status with live data
- [ ] Context list shows items with search/filter
- [ ] Config changes persist via API
- [ ] Token analytics chart renders with real data
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
