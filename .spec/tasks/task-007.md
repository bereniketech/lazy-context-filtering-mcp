---
task: 007
feature: lazy-context-filtering-mcp
status: complete
depends_on: [005, 006, 004]
---

# Task 007: Context Registration Tool (`register_context`)

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
Implement the `register_context` MCP tool — validates input, computes content hash, checks for duplicates, calls the Python engine for summarization and token counting, and stores the result.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- SHA-256 for content deduplication.
- Python engine provides `/summarize` and `/tokenize` endpoints.
- 100KB size limit on context items.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `src/server/engine-client.ts` — HTTP client for Python engine (base URL from env, methods: `score()`, `summarize()`, `tokenize()`).
2. Implement `src/server/tools/register.ts`:
   - Validate content is non-empty and ≤ 100KB.
   - Compute SHA-256 hash of content.
   - Check store for existing item with same hash → return existing ID if found.
   - Call Python `/summarize` to generate summary.
   - Call Python `/tokenize` to get token count.
   - Store `ContextItem` in DB.
   - Return `{ id, contentHash, summary, tokenCount }`.
3. Wire into MCP server (replace stub).
4. Write tests: new registration, duplicate detection, size limit rejection, engine call mocking.

_Requirements: 2.1, 2.2, 2.3, 2.4_
_Skills: code-writing-software-development, tdd-workflow_

---

## Acceptance Criteria
- [x] New context items stored with ID, hash, summary, token count
- [x] Duplicate content returns existing ID without creating new entry
- [x] Content > 100KB is rejected with clear error
- [x] All tests pass
- [x] `/verify` passes

---

## Handoff - What Was Done
- Implemented `register_context` end-to-end via `src/server/tools/register.ts` with non-empty validation, 100KB byte limit enforcement, SHA-256 deduplication, engine-backed summary/token generation, and store persistence.
- Added `src/server/engine-client.ts` HTTP client for Python engine `/score`, `/summarize`, and `/tokenize` endpoints with env-configurable base URL and timeout.
- Replaced the MCP stub for `register_context` in `src/server/index.ts` and added tests for new registration, duplicate short-circuit, and size-limit rejection with mocked engine calls.

## Handoff - Patterns Learned
- Keep generated summary in `metadata.summary` so later lazy-list tools can serve summaries without exposing full `content`.
- Run log/secrets audits with `findstr` fallback when `rg` is unavailable on Windows shells.
- Keep tool logic separated from MCP wiring so behavior can be unit-tested without starting stdio transport.

## Handoff - Files Changed
- `src/server/engine-client.ts`
- `src/server/index.ts`
- `src/server/tools/register.ts`
- `tests/server/test_register_tool.ts`
- `tests/server/test_register_tool.test.ts`

## Status
COMPLETE
