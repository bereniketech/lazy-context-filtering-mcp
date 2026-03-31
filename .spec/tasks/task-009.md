---
task: 009
feature: lazy-context-filtering-mcp
status: pending
depends_on: [003, 007]
---

# Task 009: Filter Context Tool with Token Budget

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, api-design, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement the `filter_context` MCP tool — delegates relevance scoring to the Python engine, applies token budget packing, and handles truncation for oversized items.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Greedy packing: fill token budget with highest-scored items first.
- If the top item alone exceeds budget, truncate it and set `truncated: true`.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Implement `src/server/tools/filter.ts`:
   - Load all context items from store.
   - Send items + query to Python `/score` endpoint via `engine-client.ts`.
   - Apply `minScore` threshold.
   - If `tokenBudget` is specified: pack items greedily by score until budget is exhausted.
   - If top item exceeds budget: truncate content to fit and set `truncated: true`.
   - Return `FilterResult` with scored items, total tokens, and metadata.
2. Implement `src/server/token-counter.ts` — delegates to Python `/tokenize`.
3. Wire into MCP server (replace stub).
4. Write tests: scoring integration (mock engine), budget enforcement, truncation, minScore filtering.

_Requirements: 4.1, 5.1, 5.2, 5.3, 5.4_
_Skills: code-writing-software-development, api-design, tdd-workflow_

---

## Acceptance Criteria
- [ ] Filter returns items ranked by relevance score
- [ ] Token budget is respected — total tokens ≤ budget
- [ ] Single oversized item is truncated with `truncated: true` flag
- [ ] Token count metadata included in every response
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
