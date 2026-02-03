import os

import pytest


def test_verify_token_disabled_returns_stub(monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "1")
    from server.app.auth import verify_id_token
    decoded = verify_id_token("any")
    assert decoded["uid"] == "test-user"


def test_verify_token_missing_raises(monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "1")
    from server.app.auth import verify_id_token
    with pytest.raises(ValueError):
        verify_id_token("")
