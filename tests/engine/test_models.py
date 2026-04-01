import pytest
from pydantic import ValidationError

from engine.models import ScoreRequest


def test_score_request_valid_payload() -> None:
    payload = {
        "query": "find cache invalidation notes",
        "items": [
            {
                "id": "ctx-1",
                "text": "Cache invalidation strategies for distributed systems.",
                "metadata": {"source": "doc"},
            }
        ],
        "top_k": 3,
    }

    parsed = ScoreRequest.model_validate(payload)

    assert parsed.query == payload["query"]
    assert len(parsed.items) == 1
    assert parsed.top_k == 3


def test_score_request_rejects_invalid_payload() -> None:
    payload = {
        "query": "",
        "items": [],
        "top_k": 0,
    }

    with pytest.raises(ValidationError):
        ScoreRequest.model_validate(payload)