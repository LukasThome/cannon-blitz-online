import os
from typing import Dict

import firebase_admin
from firebase_admin import auth, credentials


def _auth_disabled() -> bool:
    return os.getenv("AUTH_DISABLED", "").lower() in {"1", "true", "yes"}


def _init_admin() -> None:
    if firebase_admin._apps:
        return
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS not set")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


def verify_id_token(id_token: str) -> Dict:
    if not id_token:
        raise ValueError("Missing token")
    if _auth_disabled():
        return {"uid": "test-user"}
    _init_admin()
    return auth.verify_id_token(id_token)
