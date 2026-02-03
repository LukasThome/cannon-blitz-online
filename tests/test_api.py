from fastapi.testclient import TestClient

from server.app.main import app


client = TestClient(app)


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json().get("status") == "ok"


def test_cors_preflight_allows_vercel():
    response = client.options(
        "/health",
        headers={
            "Origin": "https://cannon-blitz-online.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") in (
        "https://cannon-blitz-online.vercel.app",
        "*",
    )
