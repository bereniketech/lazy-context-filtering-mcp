from engine.models import ScoredItem


def filter_items(
    scored_items: list[ScoredItem],
    min_score: float,
    limit: int,
) -> list[ScoredItem]:
    """
    Filter scored items by minimum score threshold and limit.
    
    Args:
        scored_items: List of ScoredItem objects (assumed to be sorted by score descending)
        min_score: Minimum relevance score to include (0.0 - 1.0)
        limit: Maximum number of items to return
        
    Returns:
        Filtered list of items, sorted by score descending
    """
    # Filter by minimum score
    filtered = [item for item in scored_items if item.score >= min_score]
    
    # Apply limit
    return filtered[:limit]
