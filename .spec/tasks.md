# Implementation Plan: Lazy Context Filtering MCP Server

- [ ] 1. Project scaffolding and shared types
  - Initialize `package.json` with TypeScript, Vitest, `@modelcontextprotocol/sdk`, Express, and Supabase client.
  - Initialize `pyproject.toml` with FastAPI, uvicorn, scikit-learn, tiktoken, pydantic, pytest, httpx.
  - Create `tsconfig.json`, ESLint config, `src/server/`, `src/engine/`, `tests/` directories.
  - Define shared TypeScript interfaces (`ContextItem`, `FilterRequest`, `FilterResult`, `ScoredContextItem`).
  - Create `docker-compose.yml` for local dev (TS server + Python engine).
  - _Requirements: 1, 10_
  - _Skills: code-writing-software-development, terminal-cli-devops_
  - **AC:** `npm install` succeeds. `pip install -e .` succeeds. `tsc --noEmit` passes. Docker Compose builds both services.

- [ ] 2. Python filtering engine — FastAPI skeleton + health check
  - Create `src/engine/main.py` with FastAPI app, CORS, `/health` endpoint.
  - Create `src/engine/models.py` with Pydantic schemas (`ScoreRequest`, `ScoreResponse`, `ScoredItem`, `SummarizeRequest`, `TokenizeRequest`).
  - Write tests for health endpoint and model validation.
  - _Requirements: 4_
  - _Skills: python-patterns, api-design, tdd-workflow_
  - **AC:** `pytest` passes. `/health` returns 200. Pydantic models validate correctly.

- [ ] 3. Python scoring engine — TF-IDF relevance scorer
  - Create `src/engine/scorer.py` with `TFIDFScorer` class using scikit-learn's `TfidfVectorizer`.
  - Implement `score(query, items, session_history)` returning scored items sorted by relevance.
  - Create `src/engine/filter.py` orchestrating scoring + threshold filtering.
  - Wire `/score` POST endpoint in `main.py`.
  - Write unit tests for scorer with known relevance rankings.
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - _Skills: python-patterns, tdd-workflow_
  - **AC:** Scorer returns items ranked by relevance. Threshold filtering excludes low scores. 1000 items scored in < 2s. Tests pass.

- [ ] 4. Python tokenizer + summarizer
  - Create `src/engine/tokenizer.py` with token counting per model family (tiktoken for GPT, char-based approximation for Claude).
  - Create `src/engine/summarizer.py` — extractive summarization (first sentence + key terms).
  - Wire `/tokenize` and `/summarize` POST endpoints.
  - Write tests for token counts and summary generation.
  - _Requirements: 5.2, 3.1_
  - _Skills: python-patterns, tdd-workflow_
  - **AC:** Token counts match expected values. Summaries are single-line, < 200 chars. Tests pass.

- [ ] 5. TypeScript MCP server — core setup + transport
  - Create `src/server/index.ts` — MCP server initialization with `@modelcontextprotocol/sdk`.
  - Implement stdio and SSE transport selection via env var or CLI flag.
  - Register empty tool handlers (stubs) for all 6 MCP tools.
  - Write integration test: client connects, handshake completes, `tools/list` returns all tools.
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Skills: code-writing-software-development, api-design, tdd-workflow_
  - **AC:** MCP client connects via stdio. `initialize` handshake succeeds. `tools/list` returns 6 tools. Malformed requests return MCP error. Tests pass.

- [ ] 6. Supabase persistence layer + in-memory fallback
  - Create `src/server/db.ts` — Supabase client with typed queries for `context_items`, `sessions`, `filter_cache`.
  - Implement `InMemoryStore` with same interface for local dev / fallback.
  - Auto-detect: use Supabase if `DATABASE_URL` is set, otherwise in-memory.
  - Create Supabase migration SQL for all 3 tables with indexes.
  - Write tests for both store implementations.
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - _Skills: code-writing-software-development, tdd-workflow, security-review_
  - **AC:** CRUD operations work on both stores. Fallback triggers when Supabase is unavailable. Migration SQL is valid. Tests pass.

- [ ] 7. Context registration tool (`register_context`)
  - Implement `src/server/tools/register.ts` — validate input, compute SHA-256 hash, check for duplicates, call Python `/summarize` and `/tokenize`, store in DB.
  - Enforce 100KB size limit.
  - Write tests: register new item, duplicate detection, size limit rejection.
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - _Skills: code-writing-software-development, tdd-workflow_
  - **AC:** Context items are stored with ID, hash, summary, token count. Duplicates return existing ID. Oversized items rejected. Tests pass.

- [ ] 8. Context retrieval tools (`list_context`, `get_context`)
  - Implement `src/server/tools/list.ts` — return metadata + summaries, support tag filtering and pagination.
  - Implement `src/server/tools/get.ts` — return full content by ID(s), 404 for missing.
  - Write tests for listing, filtering, pagination, and retrieval.
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - _Skills: code-writing-software-development, tdd-workflow_
  - **AC:** `list_context` returns summaries only (no full content). `get_context` returns full content. Missing IDs return 404. Tests pass.

- [ ] 9. Filter context tool with token budget
  - Implement `src/server/tools/filter.ts` — delegate to Python `/score`, apply token budget packing (greedy by score), handle truncation.
  - Implement `src/server/token-counter.ts` — delegate to Python `/tokenize`.
  - Write tests: scoring integration, budget enforcement, truncation flag.
  - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4_
  - _Skills: code-writing-software-development, api-design, tdd-workflow_
  - **AC:** Filter returns scored items within token budget. Truncation works for oversized single items. Token metadata included. Tests pass.

- [ ] 10. Session management + session-aware filtering
  - Implement `src/server/session.ts` — create session, track query history, expiry timer (1 hour).
  - Implement `src/server/tools/session.ts` — `create_session` and `end_session` tools.
  - Update `filter_context` to pass session history to Python scorer.
  - Write tests: session lifecycle, expiry, session-aware scoring.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - _Skills: code-writing-software-development, tdd-workflow_
  - **AC:** Sessions created with UUID. Expired sessions return error. Session history improves relevance. Tests pass.

- [ ] 11. Cache layer
  - Implement `src/server/cache.ts` — LRU cache with TTL, hash-based keys (query + context IDs), invalidation on context update/delete.
  - Integrate with `filter_context` — check cache before scoring, store results after.
  - Add `cached: true` metadata to responses.
  - Write tests: cache hit/miss, TTL expiry, invalidation.
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - _Skills: code-writing-software-development, tdd-workflow_
  - **AC:** Repeated queries return cached results. Cache invalidates on context changes. TTL works. `cached` flag present. Tests pass.

- [ ] 12. Dashboard REST API
  - Implement `src/server/api.ts` — Express routes for `/api/status`, `/api/context`, `/api/sessions`, `/api/config`, `/api/analytics`.
  - Wire into MCP server process on port 3000.
  - Write integration tests for all endpoints.
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - _Skills: code-writing-software-development, api-design, tdd-workflow_
  - **AC:** All REST endpoints return correct data. Config updates apply immediately. Tests pass.

- [ ] 13. React dashboard frontend
  - Create `src/dashboard/` with Vite + React + TypeScript.
  - Build pages: Status overview, Context list with search/filter, Session list, Config editor, Token analytics chart.
  - Connect to REST API on port 3000.
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - _Skills: code-writing-software-development, tdd-workflow_
  - **AC:** Dashboard displays server status, context items, sessions. Config changes persist. Token analytics chart renders.

- [ ] 14. CI/CD pipeline (GitHub Actions)
  - Create `.github/workflows/ci.yml` — lint, typecheck, test (TS + Python) on PR.
  - Create `.github/workflows/deploy.yml` — deploy backend to Render, dashboard to Vercel on main push.
  - Configure branch protection: require CI pass before merge.
  - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - _Skills: terminal-cli-devops_
  - **AC:** CI runs on PR. Deploy triggers on main merge. Failed CI blocks merge.

- [ ] 15. Docker Compose + Dockerfile + final integration test
  - Create `Dockerfile` (multi-stage: TS build + Python runtime).
  - Update `docker-compose.yml` with production-like config.
  - Write E2E test: register context → filter with budget → verify lazy loading → session flow.
  - _Requirements: 1, 2, 3, 4, 5, 6_
  - _Skills: terminal-cli-devops, tdd-workflow_
  - **AC:** `docker-compose up` starts both services. E2E test passes full workflow. All existing tests still pass.
