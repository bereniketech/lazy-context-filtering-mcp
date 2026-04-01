import pytest

from engine.filter import filter_items
from engine.models import ScoredItem


@pytest.fixture
def sample_scored_items() -> list[ScoredItem]:
    return [
        ScoredItem(id="item-1", text="Document 1", score=0.95),
        ScoredItem(id="item-2", text="Document 2", score=0.87),
        ScoredItem(id="item-3", text="Document 3", score=0.72),
        ScoredItem(id="item-4", text="Document 4", score=0.45),
        ScoredItem(id="item-5", text="Document 5", score=0.23),
    ]


def test_filter_items_by_min_score(sample_scored_items: list[ScoredItem]) -> None:
    """Test that items below min_score are filtered out."""
    min_score = 0.5
    limit = 10
    
    filtered = filter_items(sample_scored_items, min_score, limit)
    
    assert len(filtered) == 3, "Should have 3 items with score >= 0.5"
    assert all(item.score >= min_score for item in filtered)
    assert filtered[0].id == "item-1"
    assert filtered[1].id == "item-2"
    assert filtered[2].id == "item-3"


def test_filter_items_by_limit(sample_scored_items: list[ScoredItem]) -> None:
    """Test that result is limited to the specified limit."""
    min_score = 0.0
    limit = 2
    
    filtered = filter_items(sample_scored_items, min_score, limit)
    
    assert len(filtered) == 2, "Should return at most 2 items"
    assert filtered[0].id == "item-1"
    assert filtered[1].id == "item-2"


def test_filter_items_combined_threshold_and_limit(
    sample_scored_items: list[ScoredItem],
) -> None:
    """Test filtering with both threshold and limit."""
    min_score = 0.5
    limit = 2
    
    filtered = filter_items(sample_scored_items, min_score, limit)
    
    assert len(filtered) == 2, "Should respect both threshold and limit"
    assert all(item.score >= min_score for item in filtered)
    assert filtered[0].score > filtered[1].score, "Should maintain score order"


def test_filter_items_no_items_pass_threshold(
    sample_scored_items: list[ScoredItem],
) -> None:
    """Test when no items pass the threshold."""
    min_score = 0.99
    limit = 10
    
    filtered = filter_items(sample_scored_items, min_score, limit)
    
    assert len(filtered) == 0, "No items should pass threshold of 0.99"


def test_filter_items_empty_input() -> None:
    """Test filter with empty input list."""
    filtered = filter_items([], 0.5, 10)
    
    assert len(filtered) == 0


def test_filter_items_preserves_order(sample_scored_items: list[ScoredItem]) -> None:
    """Test that filtering preserves score order."""
    min_score = 0.2
    limit = 5
    
    filtered = filter_items(sample_scored_items, min_score, limit)
    
    for i in range(len(filtered) - 1):
        assert (
            filtered[i].score >= filtered[i + 1].score
        ), "Order should be preserved"


def test_filter_items_large_limit(sample_scored_items: list[ScoredItem]) -> None:
    """Test that limit larger than input size returns all items passing threshold."""
    min_score = 0.5
    limit = 100
    
    filtered = filter_items(sample_scored_items, min_score, limit)
    
    assert len(filtered) == 3, "Should return all 3 items passing threshold"
