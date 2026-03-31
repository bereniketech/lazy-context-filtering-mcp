---
task: 006
feature: lazy-context-filtering-mcp
status: pending
depends_on: [005]
---

# Task 006: Supabase Persistence Layer + In-Memory Fallback

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, tdd-workflow, security-review
Commands: /verify, /task-handoff

---

## Objective
Create a storage abstraction with two implementations: Supabase (PostgreSQL) and in-memory. Auto-detect which to use based on environment variables. Include migration SQL.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Supabase for persistence when `DATABASE_URL` is set.
- In-memory fallback for local dev and when Supabase is unavailable.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Define `Store` interface in `src/server/store.ts`:
   - `contextItems`: CRUD operations (create, getById, getByIds, getByHash, list, delete).
   - `sessions`: CRUD operations (create, getById, update, delete, deleteExpired).
   - `filterCache`: get, set, invalidate, deleteExpired.
2. Implement `SupabaseStore` in `src/server/db.ts` using `@supabase/supabase-js`.
3. Implement `InMemoryStore` in `src/server/memory-store.ts` using Maps.
4. Create `createStore()` factory: returns `SupabaseStore` if `DATABASE_URL` is set, else `InMemoryStore`.
5. Create `supabase/migrations/001_initial.sql` with tables: `context_items`, `sessions`, `filter_cache` with all indexes.
6. Write `tests/server/test_memory_store.ts` — full CRUD test suite.
7. Write `tests/server/test_store_interface.ts` — ensure both implementations satisfy the interface.

_Requirements: 8.1, 8.2, 8.3, 8.4_
_Skills: code-writing-software-development, tdd-workflow, security-review_

---

## Acceptance Criteria
- [ ] CRUD operations work on InMemoryStore
- [ ] SupabaseStore compiles and matches interface
- [ ] Factory returns correct store based on env
- [ ] Migration SQL creates all tables with correct indexes
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
