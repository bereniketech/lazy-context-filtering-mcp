---
task: 004
feature: lazy-context-filtering-mcp
status: pending
depends_on: [002]
---

# Task 004: Python Tokenizer + Summarizer

## Session Bootstrap
> Load these before reading anything else. Do not load skills not listed here.

Skills: python-patterns, tdd-workflow
Commands: /verify, /task-handoff

---

## Objective
Implement token counting per model family and extractive text summarization. Wire both as FastAPI endpoints.

---

## Codebase Context
### Key Code Snippets
[greenfield — no existing files to reference]

### Key Patterns in Use
[greenfield — no existing files to reference]

### Architecture Decisions Affecting This Task
- Token counting must support multiple model families (GPT via tiktoken, Claude via approximation).

---

## Handoff from Previous Task
**Files changed by previous task:** _(none yet)_
**Decisions made:** _(none yet)_
**Context for this task:** _(none yet)_
**Open questions left:** _(none yet)_

---

## Implementation Steps
1. Create `src/engine/tokenizer.py`:
   - `count_tokens(text: str, model_family: str) -> int`
   - Use `tiktoken` for GPT family (cl100k_base encoding).
   - Use character-based approximation (~4 chars/token) for Claude and generic.
2. Create `src/engine/summarizer.py`:
   - `summarize(text: str, max_length: int = 200) -> str`
   - Extract first sentence + key terms (TF-IDF top terms).
   - Ensure summary is single-line and under `max_length` chars.
3. Wire `/tokenize` POST and `/summarize` POST endpoints in `main.py`.
4. Write `tests/engine/test_tokenizer.py` — test counts for known strings across model families.
5. Write `tests/engine/test_summarizer.py` — test summary length, single-line output, key term inclusion.

_Requirements: 5.2, 3.1_
_Skills: python-patterns, tdd-workflow_

---

## Acceptance Criteria
- [ ] Token counts match expected values for known inputs
- [ ] Summaries are single-line and < 200 characters
- [ ] Both endpoints return valid responses
- [ ] All tests pass

---

## Handoff to Next Task
**Files changed:** _(fill via /task-handoff)_
**Decisions made:** _(fill via /task-handoff)_
**Context for next task:** _(fill via /task-handoff)_
**Open questions:** _(fill via /task-handoff)_
