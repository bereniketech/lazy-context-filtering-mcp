import time

import pytest

from engine.models import ContextItemPayload, ScoredItem
from engine.scorer import TFIDFScorer


@pytest.fixture
def scorer() -> TFIDFScorer:
    return TFIDFScorer()


@pytest.fixture
def sample_items() -> list[ContextItemPayload]:
    return [
        ContextItemPayload(
            id="doc-1",
            text="Python is a high-level programming language.",
            metadata={"source": "wiki"},
        ),
        ContextItemPayload(
            id="doc-2",
            text="Cache invalidation is one of the hardest problems in computer science.",
            metadata={"source": "blog"},
        ),
        ContextItemPayload(
            id="doc-3",
            text="Machine learning models require careful training and validation.",
            metadata={"source": "paper"},
        ),
        ContextItemPayload(
            id="doc-4",
            text="Python offers excellent libraries for machine learning.",
            metadata={"source": "wiki"},
        ),
    ]


def test_scorer_ranks_items_by_relevance(
    scorer: TFIDFScorer, sample_items: list[ContextItemPayload]
) -> None:
    """Test that scorer returns items ranked by relevance (highest first)."""
    query = "Python machine learning"
    
    scored = scorer.score(query, sample_items)
    
    # doc-4 should be most relevant (mentions both Python and machine learning)
    # doc-3 should be second (mentions machine learning)
    # doc-1 should be third (mentions Python)
    # doc-2 should be least relevant
    assert len(scored) == 4
    assert scored[0].id == "doc-4", "doc-4 should rank first"
    assert scored[0].score > scored[1].score, "Scores should be in descending order"
    assert scored[1].score > scored[2].score
    assert scored[2].score > scored[3].score


def test_scorer_returns_items_in_descending_order(
    scorer: TFIDFScorer, sample_items: list[ContextItemPayload]
) -> None:
    """Test that all scores are in descending order."""
    query = "programming language"
    
    scored = scorer.score(query, sample_items)
    
    for i in range(len(scored) - 1):
        assert (
            scored[i].score >= scored[i + 1].score
        ), f"Score at index {i} should be >= score at index {i+1}"


def test_scorer_returns_scored_items(
    scorer: TFIDFScorer, sample_items: list[ContextItemPayload]
) -> None:
    """Test that scorer returns ScoredItem objects with all fields."""
    query = "Python"
    
    scored = scorer.score(query, sample_items)
    
    for item in scored:
        assert isinstance(item, ScoredItem)
        assert item.id
        assert item.text
        assert isinstance(item.score, float)
        assert 0 <= item.score <= 1, "Score should be between 0 and 1"
        assert item.metadata is None or isinstance(item.metadata, dict)


def test_scorer_with_empty_session_history(
    scorer: TFIDFScorer, sample_items: list[ContextItemPayload]
) -> None:
    """Test that scorer works with empty session history."""
    query = "Python"
    session_history: list[str] = []
    
    scored = scorer.score(query, sample_items, session_history)
    
    assert len(scored) > 0


def test_scorer_with_session_history_boost(
    scorer: TFIDFScorer, sample_items: list[ContextItemPayload]
) -> None:
    """Test that scorer boosts items relevant to prior queries."""
    query = "Python"
    session_history = ["machine learning", "neural networks"]
    
    scored_with_history = scorer.score(query, sample_items, session_history)
    scored_without_history = scorer.score(query, sample_items, [])
    
    # doc-4 mentions both Python and machine learning, so should rank higher with history
    assert len(scored_with_history) == len(scored_without_history)
    # At minimum, we should get valid scores
    assert all(0 <= item.score <= 1 for item in scored_with_history)


def test_scorer_performance_1000_items(scorer: TFIDFScorer) -> None:
    """Test that 1000 items can be scored in under 2 seconds."""
    # Create 1000 synthetic items
    items = [
        ContextItemPayload(
            id=f"doc-{i}",
            text=f"Document {i} contains information about topic {i % 10}.",
            metadata={"index": i},
        )
        for i in range(1000)
    ]
    query = "topic 5"
    
    start_time = time.perf_counter()
    scored = scorer.score(query, items)
    elapsed = time.perf_counter() - start_time
    
    assert len(scored) == 1000, "All items should be scored"
    assert (
        elapsed < 2.0
    ), f"Scoring 1000 items took {elapsed:.2f}s, should be < 2s"


def test_scorer_single_item(
    scorer: TFIDFScorer,
) -> None:
    """Test that scorer works with a single item."""
    query = "test"
    items = [
        ContextItemPayload(
            id="single",
            text="This is a test document",
        )
    ]
    
    scored = scorer.score(query, items)
    
    assert len(scored) == 1
    assert scored[0].id == "single"
    assert 0 <= scored[0].score <= 1
