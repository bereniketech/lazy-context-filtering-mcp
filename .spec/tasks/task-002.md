---
task: 002
feature: lazy-context-filtering-mcp
status: complete
depends_on: [001]
---

# Task 002: Python Filtering Engine — FastAPI Skeleton + Health Check

## Skills
- .kit/skills/languages/python-patterns/SKILL.md
- .kit/skills/frameworks-backend/fastapi-pro/SKILL.md
- .kit/skills/development/api-design/SKILL.md
- .kit/rules/python/

## Agents
- @web-backend-expert

## Commands
- /task-handoff

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
- [x] `pytest tests/engine/` passes
- [x] `/health` returns 200 with correct JSON
- [x] Pydantic models reject invalid payloads with validation errors
- [x] `/verify` passes

---

## Handoff to Next Task
**Files changed:** `src/engine/main.py`, `src/engine/models.py`, `tests/engine/test_health.py`, `tests/engine/test_models.py`
**Decisions made:** Added strict request validation with `extra="forbid"` and required non-empty query/content constraints on payloads.
**Context for next task:** `ScoreRequest`/`ScoreResponse` and `ScoredItem` are now available to wire the `/score` endpoint and TF-IDF scorer in task-003.
**Open questions:** None.

## Handoff — What Was Done
- Added FastAPI CORS middleware and updated `/health` to return `{ "status": "ok", "version": "0.1.0" }`.
- Implemented all task-002 Pydantic models for score, summarize, and tokenize flows.
- Added pytest coverage for health endpoint and model validation (valid + invalid payloads).

## Handoff — Patterns Learned
- Keep request models strict with `extra="forbid"` for API payload safety and predictable contracts.
- Use non-empty field constraints (`min_length`, `ge`) to enforce validation at the model boundary.
- Use `TestClient` for lightweight FastAPI endpoint checks and model-level tests for validation semantics.

## Handoff — Files Changed
- `src/engine/main.py`
- `src/engine/models.py`
- `tests/engine/test_health.py`
- `tests/engine/test_models.py`

## Status
COMPLETE
