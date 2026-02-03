import os

from fastapi.testclient import TestClient

from server.app.main import app


client = TestClient(app)


def test_auth_verify_requires_token():
    response = client.get("/auth/verify")
    assert response.status_code == 401


def test_auth_verify_with_disabled_auth(monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "1")
    response = client.get(
        "/auth/verify",
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 200
    assert response.json().get("uid") == "test-user"
