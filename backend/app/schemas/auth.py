"""Pydantic schemas matching the frontend's auth contract exactly.

See frontend/src/services/authService.ts and frontend/src/types/dashboard.ts.
"""

import re

from pydantic import BaseModel, EmailStr, field_validator

_VALID_ROLES = {"admin", "manager", "auditor"}


def _initials_from_name(name: str) -> str:
    parts = [p for p in re.split(r"\s+", name.strip()) if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatarInitials: str

    @classmethod
    def from_model(cls, user) -> "UserOut":
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            avatarInitials=_initials_from_name(user.name),
        )


class AuthResponse(BaseModel):
    token: str
    user: UserOut
