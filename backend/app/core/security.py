"""Password hashing (bcrypt) and JWT encode/decode helpers."""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with bcrypt, returning a UTF-8 string."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        # Malformed hash stored in DB — treat as verification failure.
        return False


def create_access_token(subject: str) -> str:
    """Create a signed JWT with `subject` (the user id) as the `sub` claim."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "iat": now, "exp": expire}
    # Never log this token or its payload — it's a bearer credential.
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """Decode a JWT and return the `sub` claim (user id).

    Raises jwt.PyJWTError (or subclasses) if the token is invalid, expired,
    or malformed. Callers must not log the raw token or include it in any
    error response — see app/api/deps.py, which surfaces only a generic
    "Invalid or expired token" message.
    """
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return payload["sub"]
