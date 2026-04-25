# Code Review Report — `lazy-context-filtering-mcp`

**Reviewer:** Expert Code Review Agent
**Date:** 2026-04-25
**Scope:** Full-stack architecture — TypeScript MCP server, Python FastAPI engine, React dashboard
**Focus:** Logic placement, separation of concerns, modularity, and redundancy

---

## Executive Summary

The codebase demonstrates a well-structured, three-tier architecture with clear boundaries between the MCP/API backend (TypeScript), the ML scoring engine (Python), and the React dashboard (frontend). The vast majority of business logic is correctly placed in the backend. However, four specific issues were found: one critical frontend logic violation, one type duplication, one architectural redundancy, and one incomplete validation bypass.

---

## Section 1 — Confirmed Correctly Placed Logic

### 1.1 Core Filtering Pipeline
**Location:** `src/server/tools/filter.ts`

All filtering decision-making is exclusively in the backend: token budget enforcement, minScore threshold application, `packWithinBudget` greedy selection, binary-search truncation, cache key generation and cache hit/miss logic, and session history assembly. The frontend never participates in any of this. **Correct.**

### 1.2 Relevance Scoring (TF-IDF + Cosine Similarity + Session Boosting)
**Location:** `src/engine/scorer.py`

The TF-IDF vectorization, cosine similarity computation, and the 25%-history-boost heuristic are all encapsulated inside `TFIDFScorer.score()`. The calling code in TypeScript (`src/server/tools/filter.ts:217`) merely passes inputs and consumes outputs. **Correct.**

### 1.3 Context Registration Business Logic
**Location:** `src/server/tools/register.ts`

SHA-256 deduplication, 100KB size validation, summarization, and token counting are performed entirely server-side before any persistence. **Correct.**

### 1.4 Session Lifecycle Management
**Location:** `src/server/session.ts`

Session TTL enforcement, expiry checks, history accumulation, and cleanup scheduling all live in `SessionService`. **Correct.**

### 1.5 API Input Validation
**Location:** `src/server/api.ts:28-45`

`parsePositiveInt` and `parseNonNegativeNumber` coerce and validate all incoming configuration values before they are applied. **Correct.**

### 1.6 Pagination Arithmetic
**Location:** `src/server/api.ts:97-111`

`offset`, `totalPages`, and `total` are all computed server-side and sent to the frontend as ready-to-display values. **Correct.**

### 1.7 Cache Invalidation Ownership
**Location:** `src/server/cache.ts`, `src/server/tools/register.ts:95`

Full cache invalidation on new registration, and context-ID-scoped invalidation on deletion, are handled purely in the backend. **Correct.**

### 1.8 Analytics Aggregation
**Location:** `src/server/api.ts:173-225`

Token usage aggregation, per-session cache-entry counting, and total rollup are all computed server-side in the `/analytics` route handler. The frontend only renders the pre-aggregated values returned by the API. **Correct.**

---

## Section 2 — Redundant or Misplaced Logic (Redundant Logic Manifest)

### Issue 1 — CRITICAL: Client-side Content Search / Filtering Logic in `ContextPage`

| Field | Detail |
|-------|--------|
| **Location** | `src/dashboard/src/pages/ContextPage.tsx:26-40` |
| **Type** | Misplaced business logic |

**Code:**
```tsx
const filteredItems = useMemo(() => {
  const needle = search.toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const metadata = JSON.stringify(item.metadata).toLowerCase();
    return (
      item.content.toLowerCase().includes(needle) ||
      item.source.toLowerCase().includes(needle) ||
      metadata.includes(needle)
    );
  });
}, [items, search]);
```

**Description:** This is a full-text search decision implemented on the client side. The component fetches a fixed page of 50 items and filters them in-browser. The search logic — which fields to match, case normalization, JSON-serializing metadata — is a business rule that belongs in the backend API.

**Potential Impact:**
- The search only covers the currently loaded page, not the full dataset. If there are 500 context items and the match is on page 3, results are silently missed — a correctness bug caused directly by the misplacement.
- If the backend later adds a `GET /context?search=` endpoint, two independent filtering algorithms will exist and may diverge in behavior.
- The frontend becomes coupled to the internal data shape (e.g., knowledge that `metadata` must be JSON-serialized to search).

**Recommendation:** Add a `search` query parameter to `GET /api/context` in `src/server/api.ts`. Implement filtering there against the store results. The frontend passes the search term as a URL query parameter and renders the already-filtered response — no local `filter()` or `useMemo` required.

---

### Issue 2 — MODERATE: Duplicated `DashboardConfig` Type Definition

| Field | Detail |
|-------|--------|
| **Location 1** | `src/server/api.ts:14-19` |
| **Location 2** | `src/dashboard/src/types.ts:40-45` |
| **Type** | Type contract duplication |

**Code (server):**
```ts
export type DashboardConfig = {
  defaultMaxItems: number;
  defaultMinScore: number;
  filterCacheTtlMs: number;
  sessionTtlMs: number;
};
```

**Code (frontend):**
```ts
export type DashboardConfig = {
  defaultMaxItems: number;
  defaultMinScore: number;
  filterCacheTtlMs: number;
  sessionTtlMs: number;
};
```

**Description:** The type is defined identically in two separate compilation units. They are currently in sync, but they are not generated from a single source of truth. TypeScript will not detect divergence because the two projects compile independently.

**Potential Impact:** Silent API contract drift; future field additions require two edits; a field added to the backend type and missed on the frontend will not surface as a compile error.

**Recommendation:** Derive frontend types from a shared schema — for example, Zod schemas exported from a shared package and consumed by both projects, or an OpenAPI spec from which types are generated.

---

### Issue 3 — MODERATE: Filtering Responsibility Split Across Python Engine and TypeScript Server

| Field | Detail |
|-------|--------|
| **Location 1** | `src/engine/filter.py:4-24` and `src/engine/main.py:44` |
| **Location 2** | `src/server/tools/filter.ts:63-89` |
| **Type** | Duplicated filtering logic across service boundaries |

**Code (Python engine — hardcoded no-op threshold):**
```python
# engine/main.py:44
filtered_items = filter_items(scored_items, min_score=0.0, limit=request.top_k)
```

**Code (TypeScript server — actual threshold applied):**
```ts
// filter.ts:63-89
for (const scored of scoredByEngine) {
  if (!record || scored.score < minScore) continue;
  ...
}
return scoredItems.sort(...).slice(0, maxItems)...
```

**Description:** The engine always calls `filter_items` with `min_score=0.0` (hardcoded), meaning it never actually filters anything by score — the call is a no-op. The real `minScore` enforcement happens in the TypeScript layer via `buildScoredItems`. The `filter.py` module is therefore dead code in the current call path.

**Potential Impact:**
- Confusing ownership: it appears filtering happens in Python, but it does not.
- If a developer modifies the engine to pass the real `minScore`, items would be double-filtered with potentially inconsistent results.
- Maintaining `filter.py` and its tests creates false confidence in a code path that has no effect.

**Recommendation:** Remove the `filter_items` call and import from `src/engine/main.py`. The engine's sole responsibility should be scoring and returning ranked results. All filtering by `minScore` and `maxItems` stays in the TypeScript layer, which is already doing it correctly.

---

### Issue 4 — LOW: Hardcoded Default Config Values in Frontend Mirror Backend Constants

| Field | Detail |
|-------|--------|
| **Location 1** | `src/dashboard/src/pages/ConfigPage.tsx:5-10` |
| **Location 2** | `src/server/api.ts:4-10` |
| **Type** | Duplicated configuration knowledge |

**Code (frontend):**
```tsx
const INITIAL_CONFIG: DashboardConfig = {
  defaultMaxItems: 20,
  defaultMinScore: 0,
  filterCacheTtlMs: 300000,
  sessionTtlMs: 3600000
};
```

**Code (backend):**
```ts
const DEFAULT_MAX_ITEMS = 20;
const DEFAULT_MIN_SCORE = 0;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;   // 300000
const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000; // 3600000
```

**Description:** The frontend hardcodes the same default values as the backend to pre-populate the config form before the `GET /api/config` response arrives. If backend defaults change, the form shows incorrect placeholder values during the loading window.

**Potential Impact:** Low — the real values are fetched immediately on mount and overwrite these. However, maintaining two sets of identical constants is a maintenance burden and can mislead users during the brief loading window.

**Recommendation:** Initialize `form` state as `null`. Disable or hide the form inputs with a loading indicator until the `GET /api/config` response arrives. This eliminates the need to mirror any defaults in the frontend.

---

## Section 3 — Consolidated Recommendations

| # | Severity | File | Issue | Action |
|---|----------|------|-------|--------|
| 1 | **Critical** | `src/dashboard/src/pages/ContextPage.tsx:26-40` | Client-side search filter over partial page data | Add `search` param to `GET /api/context`; remove frontend `useMemo` filter |
| 2 | **Moderate** | `src/server/api.ts:14` / `src/dashboard/src/types.ts:40` | `DashboardConfig` type duplicated across projects | Introduce shared schema (Zod / OpenAPI) as single source of truth |
| 3 | **Moderate** | `src/engine/main.py:44` + `src/server/tools/filter.ts:63` | Score-filtering split between Python (no-op) and TypeScript (real) | Remove `filter_items` call from engine; own filtering in TypeScript layer only |
| 4 | **Low** | `src/dashboard/src/pages/ConfigPage.tsx:5-10` | Frontend hardcodes backend default values | Use null initial state; show loading until config API responds |

---

## Section 4 — Overall Architecture Assessment

| Principle | Status | Notes |
|-----------|--------|-------|
| Backend owns all business logic | Mostly Yes | One frontend search-filter violation (Issue 1) |
| Frontend is presentation-only | Mostly Yes | Issue 1 is the sole violation |
| Logic defined once, not duplicated | Partial | Issues 2, 3, and 4 each represent duplication |
| Modular, injectable dependencies | Yes | All tools accept deps as constructor params — excellent for testing |
| Clear API contract | Yes | REST API is clean and consistently typed |
| Separation of scoring vs filtering | Partial | Issue 3: responsibility split between Python engine and TypeScript server |
| Scalability | Good | Pagination, LRU cache, circuit breaker all present |
| Maintainability | Good with caveats | Type duplication creates silent drift risk |

---

## Conclusion

This is a well-architected system. The MCP server, Python engine, and React dashboard maintain clean boundaries for nearly all business logic. The single most important finding is **Issue 1** — client-side content search in `ContextPage` — which both violates the separation-of-concerns principle and introduces a real correctness defect (search is limited to the current page only). Issues 2, 3, and 4 are moderate-to-low maintainability concerns rather than fundamental design flaws.

Resolving all four issues — particularly moving search server-side and consolidating the type definitions — would make this a textbook example of a clean, maintainable, and backend-authoritative architecture.
