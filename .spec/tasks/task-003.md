---
task: 003
feature: lazy-context-filtering-mcp
status: pending
depends_on: [002]
---

# Task 003: Python Scoring Engine — TF-IDF Relevance Scorer

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: python-patterns, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement the core relevance scoring engine using scikit-learn's TF-IDF vectorizer. Create the scorer class, filter orchestrator, and wire the `/score` endpoint.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- ADR-3: TF-IDF baseline scorer. Optional embedding-based scorer later.

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `src/engine/scorer.py` with `TFIDFScorer` class.
   - `score(query: str, items: list[ContextItemPayload], session_history: list[str]) -> list[ScoredItem]`
   - Use `TfidfVectorizer` to compute cosine similarity between query and each item's content.
   - If `session_history` is provided, boost items relevant to prior queries.
2. Create `src/engine/filter.py` with `filter_items(scored_items, min_score, limit)` — threshold + limit filtering.
3. Wire `/score` POST endpoint in `main.py` using `ScoreRequest` → `ScoreResponse`.
4. Write `tests/engine/test_scorer.py` — test with known documents and expected ranking order.
5. Write `tests/engine/test_filter.py` — test threshold filtering and limit.
6. Write performance test: 1000 items scored in < 2 seconds.

_Requirements: 4.1, 4.2, 4.3, 4.4_
_Skills: python-patterns, tdd-workflow_

---

## Acceptance Criteria
- [ ] Scorer returns items ranked by relevance (most relevant first)
- [ ] Threshold filtering excludes items below `min_score`
- [ ] 1000 items scored in < 2 seconds
- [ ] `/score` endpoint returns valid `ScoreResponse`
- [ ] All tests pass

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
