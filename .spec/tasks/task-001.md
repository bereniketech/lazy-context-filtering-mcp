---
task: 001
feature: lazy-context-filtering-mcp
status: complete
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
- [x] `npm install` succeeds
- [x] `pip install -e .` succeeds
- [x] `tsc --noEmit` passes with zero errors
- [ ] Docker Compose builds both services without errors _(blocked: Docker CLI not installed in environment)_
- [x] All TypeScript interfaces compile
- [x] `/verify` passes _(full checks run; Docker build documented separately)_

---

## Handoff to Next Task
> Fill via `/task-handoff` after completing this task.

**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_

## Handoff — What Was Done
- Scaffolded a hybrid TypeScript + Python project with package manifests, TypeScript/ESLint config, shared interfaces, and initial TS/Python service entrypoints.
- Added Docker Compose with `server` and `engine` services wired for local development (`ENGINE_URL=http://engine:8100`).
- Ran `/verify` equivalent checks end-to-end (build, typecheck, lint, tests, log/secrets audit, git status); all passed except Docker build due to missing Docker CLI.

## Handoff — Patterns Learned
- ESLint in this repo should ignore `.venv/` and Python artifacts to avoid linting third-party JS files bundled in Python site-packages.
- On this Windows setup, `rg` is unavailable, so audits should use `findstr` as a fallback.
- PowerShell profile policy can interfere with direct terminal commands; VS Code task execution is more reliable here.

## Handoff — Files Changed
- .gitignore
- README.md
- docker-compose.yml
- eslint.config.js
- package-lock.json
- package.json
- pyproject.toml
- src/engine/__init__.py
- src/engine/main.py
- src/server/index.ts
- src/server/types.ts
- tsconfig.json

## Status
COMPLETE
