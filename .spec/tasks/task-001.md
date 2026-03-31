---
task: 001
feature: lazy-context-filtering-mcp
status: pending
depends_on: []
---

# Task 001: Project Scaffolding and Shared Types

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, terminal-cli-devops
Commands: /verify, /task-handoff

---

## Objective
Set up the full project structure for a hybrid TypeScript + Python MCP server. Initialize both package managers, configure TypeScript, define shared interfaces, and create a Docker Compose file for local development.

---

## Codebase Context
> Pre-populated by Task Enrichment. No file reading required.

### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- ADR-1: Hybrid TS + Python architecture. TS handles MCP protocol, Python handles scoring.
- ADR-2: Local HTTP (FastAPI on port 8100) for TS-Python communication.

---

## Handoff from Previous Task
> Populated by /task-handoff after prior task completes. Empty for task-001.

**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Initialize `package.json` with dependencies: `@modelcontextprotocol/sdk`, `express`, `@supabase/supabase-js`, `uuid`, `crypto`.
2. Add dev dependencies: `typescript`, `vitest`, `@types/express`, `@types/node`, `tsx`, `eslint`.
3. Create `tsconfig.json` targeting ES2022, module NodeNext, strict mode.
4. Create ESLint config (flat config).
5. Initialize `pyproject.toml` with dependencies: `fastapi`, `uvicorn[standard]`, `scikit-learn`, `tiktoken`, `pydantic`, `pytest`, `httpx`, `pytest-asyncio`.
6. Create directory structure: `src/server/tools/`, `src/engine/`, `src/dashboard/`, `tests/server/`, `tests/engine/`.
7. Define TypeScript interfaces in `src/server/types.ts`: `ContextItem`, `FilterRequest`, `FilterResult`, `ScoredContextItem`, `Session`.
8. Create `docker-compose.yml` with two services: `server` (Node) and `engine` (Python/uvicorn).
9. Add npm scripts: `build`, `dev`, `test`, `lint`, `typecheck`.

_Requirements: 1, 10_
_Skills: code-writing-software-development, terminal-cli-devops_

---

## Acceptance Criteria
- [ ] `npm install` succeeds
- [ ] `pip install -e .` succeeds
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Docker Compose builds both services without errors
- [ ] All TypeScript interfaces compile
- [ ] `/verify` passes

---

## Handoff to Next Task
> Fill via `/task-handoff` after completing this task.

**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
