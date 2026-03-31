---
task: 014
feature: lazy-context-filtering-mcp
status: pending
depends_on: [012]
---

# Task 014: CI/CD Pipeline (GitHub Actions)

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: terminal-cli-devops
Commands: /verify, /task-handoff

---

## Objective
Set up GitHub Actions workflows for CI (lint, typecheck, test on PR) and CD (deploy backend to Render, dashboard to Vercel on main push).

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- CI must cover both TypeScript and Python.
- Deploy backend to Render, dashboard to Vercel.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `.github/workflows/ci.yml`:
   - Trigger on PR to main.
   - Matrix: Node 20 + Python 3.11.
   - Steps: checkout, install deps (npm + pip), lint (eslint + ruff/flake8), typecheck (`tsc --noEmit`), test (`vitest run` + `pytest`).
   - Report coverage.
2. Create `.github/workflows/deploy.yml`:
   - Trigger on push to main.
   - Deploy backend to Render via deploy hook or Render API.
   - Deploy dashboard to Vercel via Vercel CLI or GitHub integration.
3. Add branch protection rules documentation (manual step for repo admin).

_Requirements: 10.1, 10.2, 10.3, 10.4_
_Skills: terminal-cli-devops_

---

## Acceptance Criteria
- [ ] CI workflow runs on PR and tests both TS and Python
- [ ] Deploy workflow triggers on main push
- [ ] CI failure blocks merge (documented branch protection setup)
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
