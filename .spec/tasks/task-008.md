---
task: 008
feature: lazy-context-filtering-mcp
status: pending
depends_on: [006, 007]
---

# Task 008: Context Retrieval Tools (`list_context`, `get_context`)

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement the lazy loading tools: `list_context` returns metadata/summaries only, `get_context` returns full content by ID(s).

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Lazy loading: summaries first, full content on demand.
- Must support tag filtering and pagination on `list_context`.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Implement `src/server/tools/list.ts`:
   - Accept optional `tags`, `limit` (default 50), `offset` (default 0).
   - Query store for matching items.
   - Return `{ items: [{ id, summary, metadata, tokenCount }], total }` — NO full content.
2. Implement `src/server/tools/get.ts`:
   - Accept `ids: string[]`.
   - Query store for items by IDs.
   - Return full content for found items.
   - Return not-found error for missing IDs.
3. Wire both into MCP server (replace stubs).
4. Write tests: list returns summaries only, tag filtering works, pagination works, get returns full content, missing ID returns 404.

_Requirements: 3.1, 3.2, 3.3, 3.4_
_Skills: code-writing-software-development, tdd-workflow_

---

## Acceptance Criteria
- [ ] `list_context` returns summaries only (no `content` field)
- [ ] Tag filtering and pagination work correctly
- [ ] `get_context` returns full content for valid IDs
- [ ] Missing IDs return not-found error
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
