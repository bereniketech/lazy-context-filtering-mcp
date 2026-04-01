from fastapi.testclient import TestClient

from engine.main import app


def test_health_returns_ok_with_version() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}