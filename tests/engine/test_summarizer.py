from fastapi.testclient import TestClient

from engine.main import app
from engine.summarizer import summarize


def test_summarize_is_single_line_and_under_limit() -> None:
    text = "Python powers data pipelines. Teams use Python for analytics and testing workflows."

    result = summarize(text, max_length=120)

    assert "\n" not in result
    assert len(result) <= 120


def test_summarize_includes_key_terms() -> None:
    text = (
        "Python stream processing enables resilient analytics systems. "
        "Analytics teams rely on Python processing for automation."
    )

    result = summarize(text, max_length=200).lower()

    assert "python" in result
    assert "analytics" in result


def test_summarize_endpoint_returns_valid_response() -> None:
    client = TestClient(app)

    response = client.post(
        "/summarize",
        json={
            "text": "Caching improves performance. Caching also reduces repeated database reads.",
            "max_length": 120,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "summary" in payload
    assert "\n" not in payload["summary"]
    assert len(payload["summary"]) <= 120