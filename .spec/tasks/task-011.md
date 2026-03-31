---
task: 011
feature: lazy-context-filtering-mcp
status: pending
depends_on: [009]
---

# Task 011: Cache Layer

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
- [ ] Repeated identical queries return cached results
- [ ] Cache invalidates when context items are updated/deleted
- [ ] TTL expiry works (entries disappear after configured TTL)
- [ ] `cached: true` flag present on cache hits
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
