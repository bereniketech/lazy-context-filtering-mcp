---
task: 002
feature: lazy-context-filtering-mcp
status: pending
depends_on: [001]
---

# Task 002: Python Filtering Engine — FastAPI Skeleton + Health Check

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: python-patterns, api-design, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Create the Python FastAPI application skeleton with health endpoint and all Pydantic request/response models. This is the foundation for the scoring, tokenizing, and summarizing endpoints.

---

## Codebase Context
> Pre-populated by Task Enrichment. No file reading required.

### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- ADR-2: FastAPI on localhost:8100 for TS-Python communication.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `src/engine/__init__.py`.
2. Create `src/engine/models.py` with Pydantic models: `ContextItemPayload`, `ScoreRequest`, `ScoreResponse`, `ScoredItem`, `SummarizeRequest`, `SummarizeResponse`, `TokenizeRequest`, `TokenizeResponse`.
3. Create `src/engine/main.py` with FastAPI app, CORS middleware, `/health` GET endpoint returning `{ status: "ok", version: "0.1.0" }`.
4. Write `tests/engine/test_health.py` — test health endpoint returns 200.
5. Write `tests/engine/test_models.py` — test Pydantic model validation (valid + invalid payloads).

_Requirements: 4_
_Skills: python-patterns, api-design, tdd-workflow_

---

## Acceptance Criteria
- [ ] `pytest tests/engine/` passes
- [ ] `/health` returns 200 with correct JSON
- [ ] Pydantic models reject invalid payloads with validation errors
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
