"""Tests for authentication: signup, login (valid/invalid), JWT validation
(malformed/expired/missing tokens), password hashing, and rate limiting.
"""

import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limit import InMemoryRateLimiter
from app.core.security import create_access_token, hash_password, verify_password


def test_signup_success(client: TestClient):
    response = client.post(
        "/auth/signup",
        json={"name": "Auth Test", "email": "auth.success@example.com", "password": "supersecret123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert "token" in body
    assert body["user"]["email"] == "auth.success@example.com"
    # The password hash must never be echoed back in the response.
    assert "password" not in body["user"]
    assert "hashed_password" not in body["user"]

    # Cleanup: this test doesn't use the make_user fixture, so clean up manually.
    from app.db.session import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "auth.success@example.com").first()
        if user:
            db.delete(user)
            db.commit()
    finally:
        db.close()


def test_signup_duplicate_email_rejected(client: TestClient, make_user):
    _headers, _uid, email = make_user()
    response = client.post(
        "/auth/signup",
        json={"name": "Duplicate", "email": email, "password": "supersecret123"},
    )
    assert response.status_code == 409


def test_signup_password_too_short_rejected(client: TestClient):
    response = client.post(
        "/auth/signup",
        json={"name": "Short PW", "email": "short.pw@example.com", "password": "abc"},
    )
    assert response.status_code == 422


def test_login_valid_credentials(client: TestClient):
    email = "login.valid@example.com"
    client.post("/auth/signup", json={"name": "Login Valid", "email": email, "password": "supersecret123"})

    response = client.post("/auth/signin", json={"email": email, "password": "supersecret123"})
    assert response.status_code == 200
    assert "token" in response.json()

    from app.db.session import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
            db.commit()
    finally:
        db.close()


def test_login_invalid_password(client: TestClient, make_user):
    _headers, _uid, email = make_user()
    response = client.post("/auth/signin", json={"email": email, "password": "wrongpassword"})
    assert response.status_code == 401
    # Must not reveal whether the email exists or the password was wrong.
    assert response.json()["detail"] == "Invalid email or password"


def test_login_nonexistent_email(client: TestClient):
    response = client.post("/auth/signin", json={"email": "does.not.exist@example.com", "password": "whatever123"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_unauthorized_request_without_token_returns_401(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_malformed_token_returns_401(client: TestClient):
    response = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert response.status_code == 401


def test_expired_token_returns_401(client: TestClient, make_user):
    _headers, user_id, _email = make_user()

    import datetime

    expired_payload = {
        "sub": user_id,
        "iat": datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=2),
        "exp": datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1),
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401


def test_token_signed_with_wrong_secret_returns_401(client: TestClient, make_user):
    _headers, user_id, _email = make_user()

    bad_token = jwt.encode({"sub": user_id}, "wrong-secret-entirely", algorithm=settings.JWT_ALGORITHM)
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {bad_token}"})
    assert response.status_code == 401


def test_token_for_deleted_user_returns_401(client: TestClient):
    # Create a token for a user id that doesn't exist in the database.
    token = create_access_token(subject="00000000-0000-0000-0000-000000000000")
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_valid_token_returns_current_user(client: TestClient, make_user):
    headers, _user_id, email = make_user("Current User Test")
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email


def test_password_is_hashed_not_plaintext():
    plain = "supersecret123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert hashed.startswith("$2b$")  # bcrypt hash prefix
    assert verify_password(plain, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_rate_limiter_blocks_after_threshold():
    limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        limiter.check("test-key")
    with pytest.raises(Exception) as exc_info:
        limiter.check("test-key")
    assert "429" in str(exc_info.value.status_code) or exc_info.value.status_code == 429


def test_rate_limiter_does_not_block_different_keys():
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60)
    limiter.check("key-a")
    # A different key should not be affected by key-a's limit.
    limiter.check("key-b")
