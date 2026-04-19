---
task: 005
feature: lazy-context-filtering-mcp
status: complete
depends_on: [001]
---

# Task 005: TypeScript MCP Server — Core Setup + Transport

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
- [x] MCP client connects via stdio
- [x] `initialize` handshake succeeds
- [x] `tools/list` returns 6 tools with correct names and schemas
- [x] Malformed requests return standard MCP errors
- [x] All tests pass
- [x] `/verify` passes

---

## Handoff to Next Task
**Files changed:**
- `src/server/index.ts`
- `tests/server/test_mcp.ts`
- `tests/server/test_mcp.test.ts`
- `package.json`
- `tsconfig.json`

**Decisions made:**
- Implemented MCP tool registration with `McpServer.registerTool` and Zod v4 schemas for all 6 required stubs.
- Added runtime transport selection via `MCP_TRANSPORT` with stdio as default and legacy SSE compatibility endpoints.
- Implemented protocol tests with stdio client transport, explicit tools/list assertions, and malformed-request method-not-found validation.

**Context for next task:**
- `src/server/index.ts` now exports `createMcpServer`, `startStdioServer`, `startSseServer`, and `startServerFromEnv` for reuse in follow-up tasks.
- MCP tool names are centralized in `MCP_TOOL_NAMES` for test and implementation consistency.
- Test discovery is anchored via `tests/server/test_mcp.test.ts`, which loads task-required tests from `tests/server/test_mcp.ts`.

**Open questions:**
- None.

## Handoff — What Was Done
- Built the TypeScript MCP server with env-based transport selection (`stdio` default, `sse` optional).
- Registered six required tool stubs with typed Zod input schemas and placeholder responses.
- Added protocol compliance tests for stdio connection, initialization handshake, tools listing, and malformed request behavior.

## Handoff — Patterns Learned
- Use `McpServer.registerTool` plus Zod schemas to keep tool contracts explicit and testable.
- For stdio protocol tests, use `StdioClientTransport` to spawn Node with `--import tsx/esm` against TypeScript entrypoints.
- Keep test entrypoints aligned with Vitest include behavior by using a `.test.ts` loader file when task naming constraints require nonstandard test filenames.

## Handoff — Files Changed
- `src/server/index.ts`
- `tests/server/test_mcp.ts`
- `tests/server/test_mcp.test.ts`
- `package.json`
- `tsconfig.json`

## Status
COMPLETE
