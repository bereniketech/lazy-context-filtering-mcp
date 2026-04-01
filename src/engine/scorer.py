from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from engine.models import ContextItemPayload, ScoredItem


class TFIDFScorer:
    """Scorer that uses TF-IDF and cosine similarity to rank items by relevance."""

    def __init__(self) -> None:
        """Initialize the TF-IDF vectorizer."""
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            token_pattern=r"(?u)\b\w\w+\b",  # Requires 2+ character tokens
            stop_words="english",
            max_features=1000,
        )

    def score(
        self,
        query: str,
        items: list[ContextItemPayload],
        session_history: list[str] | None = None,
    ) -> list[ScoredItem]:
        """
        Score items by relevance to query using TF-IDF and cosine similarity.
        
        Args:
            query: The search query
            items: List of context items to score
            session_history: Optional list of prior queries to boost related items
            
        Returns:
            List of ScoredItem objects ranked by relevance (highest first)
        """
        if not items:
            return []

        if session_history is None:
            session_history = []

        # Prepare documents: combine query boosting context
        documents = [item.text for item in items]
        
        # Fit vectorizer on documents and query
        all_texts = [query] + documents
        if session_history:
            all_texts.extend(session_history)
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        except ValueError:
            # If vectorizer fails (e.g., insufficient documents), return zero scores
            return [
                ScoredItem(
                    id=item.id,
                    text=item.text,
                    score=0.0,
                    metadata=item.metadata,
                )
                for item in items
            ]

        # Compute similarity between query and each document
        query_vector = tfidf_matrix[0]
        document_vectors = tfidf_matrix[1 : len(items) + 1]
        
        similarities = cosine_similarity(query_vector, document_vectors)[0]
        
        # Create scored items
        scored_items: list[ScoredItem] = []
        for idx, item in enumerate(items):
            score = float(similarities[idx])
            
            # Boost score if item is relevant to session history
            if session_history:
                history_vectors = tfidf_matrix[len(items) + 1 :]
                history_similarities = cosine_similarity(
                    document_vectors[idx : idx + 1], history_vectors
                )[0]
                max_history_similarity = float(history_similarities.max()) if len(history_similarities) > 0 else 0.0
                # Apply modest boost (25%) if related to history
                if max_history_similarity > 0.1:
                    score = min(1.0, score + (max_history_similarity * 0.25))
            
            scored_items.append(
                ScoredItem(
                    id=item.id,
                    text=item.text,
                    score=score,
                    metadata=item.metadata,
                )
            )
        
        # Sort by score descending
        scored_items.sort(key=lambda x: x.score, reverse=True)
        
        return scored_items
