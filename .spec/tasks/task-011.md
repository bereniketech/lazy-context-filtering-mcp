---
task: 011
feature: lazy-context-filtering-mcp
status: complete
depends_on: [009]
---

# Task 011: Cache Layer

## Skills
- .kit/skills/languages/typescript-expert/SKILL.md
- .kit/skills/testing-quality/tdd-workflow/SKILL.md
- .kit/rules/typescript/

## Agents
- @web-backend-expert

## Commands
- /tdd
- /task-handoff

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement an LRU cache with TTL for filter results. Integrate with `filter_context` to serve cached results and invalidate on context changes.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Cache key: hash of (query + sorted context IDs + session ID).
- Default TTL: 5 minutes, configurable.
- Invalidate all entries referencing a changed/deleted context item.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Implement `src/server/cache.ts`:
   - `CacheManager` class with LRU eviction and TTL.
   - `get(key)` — return cached result or null.
   - `set(key, result, contextIds, ttl?)` — store result with reference to context IDs.
   - `invalidate(contextId)` — remove all entries referencing that context ID.
   - `clear()` — flush entire cache.
2. Integrate into `src/server/tools/filter.ts`:
   - Before scoring: compute cache key, check cache. If hit, return with `cached: true`.
   - After scoring: store result in cache.
3. Integrate into `src/server/tools/register.ts` and store delete operations: invalidate cache when context changes.
4. Write tests: cache hit, cache miss, TTL expiry, invalidation on context change, `cached` flag.

_Requirements: 7.1, 7.2, 7.3, 7.4_
_Skills: code-writing-software-development, tdd-workflow_

---

## Acceptance Criteria
- [x] Repeated identical queries return cached results
- [x] Cache invalidates when context items are updated/deleted
- [x] TTL expiry works (entries disappear after configured TTL)
- [x] `cached: true` flag present on cache hits
- [x] All tests pass
- [x] `/verify` passes

---

## Handoff to Next Task
**Files changed:**
- `src/server/cache.ts`
- `src/server/tools/filter.ts`
- `src/server/tools/register.ts`
- `src/server/memory-store.ts`
- `src/server/db.ts`
- `src/server/types.ts`
- `tests/server/test_cache.ts`
- `tests/server/test_cache.test.ts`
- `tests/server/test_filter_tool.ts`
- `tests/server/test_register_tool.ts`

**Decisions made:**
- Added an in-process `CacheManager` with TTL + LRU + per-context invalidation references.
- Cache key is SHA-256 hash of `query + sessionId + sorted context IDs` as required.
- `filter_context` now returns `cached: true` on hits and reuses stored `FilterResult`.
- `register_context` clears cache after successful new context creation, and `contextItems.delete` invalidates by context ID in both store implementations.

**Context for next task:**
- Cache defaults are env-configurable via `FILTER_CACHE_TTL_MS` and `FILTER_CACHE_MAX_ENTRIES`.
- Verification completed: build, typecheck, lint, tests all passing; log/secrets audits run via cmd fallback due missing `rg` binary.

**Open questions:**
- Whether context updates (not only create/delete) should be added as explicit API operations in upcoming tasks to trigger targeted invalidation.
