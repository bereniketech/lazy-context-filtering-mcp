---
task: 010
feature: lazy-context-filtering-mcp
status: done
depends_on: [009]
---

# Task 010: Session Management + Session-Aware Filtering

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement session lifecycle management (create, expire, end) and integrate session history into the filtering pipeline so relevance improves over a conversation.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Sessions expire after 1 hour of inactivity.
- Session history (prior queries + retrieved IDs) is sent to Python scorer to boost relevance.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Implement `src/server/session.ts`:
   - `createSession(config?)` — generate UUID, set expiry to now + 1 hour, store.
   - `getSession(id)` — return session or throw if expired/not found.
   - `updateSession(id, query, retrievedIds)` — append to history, update `last_active_at`, extend expiry.
   - `endSession(id)` — delete session and associated cache entries.
   - `cleanExpiredSessions()` — periodic cleanup (run every 5 minutes).
2. Implement `src/server/tools/session.ts`:
   - `create_session` tool → calls `createSession()`.
   - `end_session` tool → calls `endSession()`.
3. Update `src/server/tools/filter.ts`:
   - If `sessionId` provided: load session, append query to history, pass `session_history` to Python scorer.
   - After scoring: update session with retrieved context IDs.
4. Write tests: session create, session expiry, expired session error, session-aware scoring boost.

_Requirements: 6.1, 6.2, 6.3, 6.4_
_Skills: code-writing-software-development, tdd-workflow_

---

## Acceptance Criteria
- [x] Sessions created with UUID and 1-hour expiry
- [x] Expired sessions return session-expired error
- [x] Session history is passed to Python scorer
- [x] `end_session` cleans up session data
- [x] All tests pass
- [x] `/verify` passes

---

## Handoff to Next Task
**Files changed:**
- `src/server/session.ts`
- `src/server/tools/session.ts`
- `src/server/tools/filter.ts`
- `src/server/engine-client.ts`
- `src/server/index.ts`
- `src/engine/models.py`
- `src/engine/main.py`
- `tests/server/test_session_tool.ts`
- `tests/server/test_session_tool.test.ts`
- `tests/server/test_filter_tool.ts`
- `bug-log.md`

**Decisions made:**
- Implemented a dedicated `SessionService` for lifecycle operations and in-memory session history tracking.
- Added periodic cleanup via `startSessionCleanup` with 5-minute interval.
- Kept `session_history` optional in score API and `sessionId` optional in `filter_context` to preserve backward compatibility.
- Recorded retrieved IDs after each filter call through `SessionService.updateSession`.

**Context for next task:**
- Session history is process-memory only and keyed by session ID; it is not persisted in Supabase yet.
- Expired sessions are deleted on access (`getSession`) and also via periodic cleanup.
- `create_session` and `end_session` MCP tools are now fully wired and return structured JSON payloads.

**Open questions:**
- Should session history be persisted in DB for multi-instance/server-restart continuity?
