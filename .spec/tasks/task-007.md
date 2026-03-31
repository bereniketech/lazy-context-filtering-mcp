---
task: 007
feature: lazy-context-filtering-mcp
status: pending
depends_on: [005, 006, 004]
---

# Task 007: Context Registration Tool (`register_context`)

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
- [ ] New context items stored with ID, hash, summary, token count
- [ ] Duplicate content returns existing ID without creating new entry
- [ ] Content > 100KB is rejected with clear error
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
