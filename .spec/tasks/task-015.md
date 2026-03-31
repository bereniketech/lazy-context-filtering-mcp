---
task: 015
feature: lazy-context-filtering-mcp
status: pending
depends_on: [010, 011, 013, 014]
---

# Task 015: Docker Compose + Dockerfile + Final Integration Test

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: terminal-cli-devops, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Create production-ready Docker configuration and write an end-to-end integration test that exercises the full workflow: register → filter → lazy load → session management.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Multi-stage Dockerfile: TS build stage + Python runtime stage (or separate containers).
- Docker Compose orchestrates both services.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `Dockerfile` for TS server (multi-stage: build with Node, run with Node slim).
2. Create `Dockerfile.engine` for Python engine (based on python:3.11-slim).
3. Update `docker-compose.yml`:
   - `server` service: build from Dockerfile, expose port 3000, depends on `engine`.
   - `engine` service: build from Dockerfile.engine, expose port 8100.
   - Health checks on both services.
   - Environment variables from `.env`.
4. Write `tests/e2e/test_full_workflow.ts`:
   - Register 5 context items via MCP client.
   - Create a session.
   - Filter with a query and token budget — verify ranked results within budget.
   - Call `list_context` — verify summaries only.
   - Call `get_context` — verify full content.
   - Filter again with same query — verify `cached: true`.
   - End session — verify cleanup.
5. Ensure all existing tests still pass.

_Requirements: 1, 2, 3, 4, 5, 6_
_Skills: terminal-cli-devops, tdd-workflow_

---

## Acceptance Criteria
- [ ] `docker-compose up --build` starts both services successfully
- [ ] Health checks pass on both containers
- [ ] E2E test passes the full workflow
- [ ] All existing unit and integration tests still pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
