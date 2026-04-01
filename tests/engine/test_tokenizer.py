from fastapi.testclient import TestClient

from engine.main import app
from engine.tokenizer import count_tokens


def test_count_tokens_gpt_known_input() -> None:
    assert count_tokens("hello world", "gpt") == 2


def test_count_tokens_claude_uses_character_approximation() -> None:
    assert count_tokens("abcdefghij", "claude") == 3


def test_count_tokens_generic_uses_character_approximation() -> None:
    assert count_tokens("12345678", "generic") == 2


def test_tokenize_endpoint_returns_valid_response() -> None:
    client = TestClient(app)

    response = client.post(
        "/tokenize",
        json={"text": "hello world", "model_family": "gpt"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_count"] == 2
    assert isinstance(payload["tokens"], list)