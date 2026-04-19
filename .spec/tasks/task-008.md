---
task: 008
feature: lazy-context-filtering-mcp
status: complete
depends_on: [006, 007]
---

# Task 008: Context Retrieval Tools (`list_context`, `get_context`)

## Skills
- .kit/skills/languages/typescript-expert/SKILL.md
- .kit/skills/development/api-design/SKILL.md
- .kit/rules/typescript/

## Agents
- @web-backend-expert

## Commands
- /task-handoff

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
- [x] `list_context` returns summaries only (no `content` field)
- [x] Tag filtering and pagination work correctly
- [x] `get_context` returns full content for valid IDs
- [x] Missing IDs return not-found error
- [x] All tests pass
- [x] `/verify` passes

---

## Handoff - What Was Done
- Implemented `list_context` in `src/server/tools/list.ts` with tags filtering, pagination defaults (`limit=50`, `offset=0`), and summary-only response shape that excludes full content.
- Implemented `get_context` in `src/server/tools/get.ts` with multi-ID retrieval, deterministic output ordering, and not-found MCP error (`InvalidParams` + `statusCode: 404`).
- Wired both tools into MCP in `src/server/index.ts` by replacing stubs and updating schemas (`list: tags/limit/offset`, `get: ids[]`), and added unit tests for all acceptance paths.

## Handoff - Patterns Learned
- Keep tool business logic isolated in `src/server/tools/*.ts` and keep MCP handlers thin to simplify unit testing without transport setup.
- Treat `findstr` exit code `1` as "no matches" for Windows log/secrets audits in this repo.
- Store `summary` in metadata but strip it from `metadata` in list responses to keep API payload intent explicit.

## Handoff - Files Changed
- `src/server/index.ts`
- `src/server/tools/get.ts`
- `src/server/tools/list.ts`
- `tests/server/test_context_retrieval_tools.ts`
- `tests/server/test_context_retrieval_tools.test.ts`

## Status
COMPLETE
