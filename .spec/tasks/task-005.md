---
task: 005
feature: lazy-context-filtering-mcp
status: pending
depends_on: [001]
---

# Task 005: TypeScript MCP Server — Core Setup + Transport

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: code-writing-software-development, api-design, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Create the TypeScript MCP server using `@modelcontextprotocol/sdk`. Implement transport selection (stdio/SSE), register all 6 tool stubs, and verify MCP protocol compliance.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- ADR-1: TypeScript handles MCP protocol layer.
- Must support both stdio and SSE transports.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `src/server/index.ts`:
   - Initialize `McpServer` from `@modelcontextprotocol/sdk`.
   - Select transport based on `MCP_TRANSPORT` env var (default: stdio).
   - For SSE: create Express server, mount SSE transport.
2. Register 6 tool stubs with proper input schemas (Zod):
   - `register_context`, `list_context`, `get_context`, `filter_context`, `create_session`, `end_session`.
   - Each stub returns a placeholder response.
3. Write `tests/server/test_mcp.ts`:
   - Test MCP client connects via stdio transport.
   - Test `initialize` handshake completes.
   - Test `tools/list` returns all 6 tools with correct schemas.
   - Test malformed request returns MCP error.

_Requirements: 1.1, 1.2, 1.3, 1.4_
_Skills: code-writing-software-development, api-design, tdd-workflow_

---

## Acceptance Criteria
- [ ] MCP client connects via stdio
- [ ] `initialize` handshake succeeds
- [ ] `tools/list` returns 6 tools with correct names and schemas
- [ ] Malformed requests return standard MCP errors
- [ ] All tests pass
- [ ] `/verify` passes

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
