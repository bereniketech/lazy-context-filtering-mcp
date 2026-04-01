---
task: 009
feature: lazy-context-filtering-mcp
status: complete
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
- [x] Filter returns items ranked by relevance score
- [x] Token budget is respected — total tokens ≤ budget
- [x] Single oversized item is truncated with `truncated: true` flag
- [x] Token count metadata included in every response
- [x] All tests pass
- [x] `/verify` passes

---

## Handoff to Next Task
**Files changed:**
- `src/server/index.ts`
- `src/server/types.ts`
- `src/server/token-counter.ts`
- `src/server/tools/filter.ts`
- `tests/server/test_filter_tool.ts`
- `tests/server/test_filter_tool.test.ts`

**Decisions made:**
- `filter_context` delegates ranking to Python `/score`, then applies `minScore`, optional greedy budget packing, and top-item truncation when the highest-ranked item exceeds budget.
- Token counting for truncation is delegated to Python `/tokenize` through a dedicated `token-counter.ts` helper.
- Response metadata includes `query`, `totalTokens`, `tokenBudget`, `minScore`, `totalCandidates`, and `droppedItemIds`.

**Context for next task:**
- `filter_context` is fully implemented and no longer a stub in MCP registration.
- `create_session` and `end_session` remain stubs and are ready for task 010 implementation.
- New tests cover ranking, min-score filtering, budget enforcement, and truncation behavior.

**Open questions:**
- Should future session-aware scoring pass full session history to `/score` payload now, or add a dedicated endpoint contract update in the Python engine first?
