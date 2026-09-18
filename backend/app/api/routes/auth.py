"""Auth routes: signup, signin, me.

Contract matches frontend/src/services/authService.ts exactly.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import enforce_auth_rate_limit
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, SignInRequest, SignUpRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
    description="Registers a new user with a bcrypt-hashed password and returns a JWT bearer token.",
)
def signup(payload: SignUpRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    enforce_auth_rate_limit(request)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="manager",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return AuthResponse(token=token, user=UserOut.from_model(user))


@router.post(
    "/signin",
    response_model=AuthResponse,
    summary="Sign in",
    description="Verifies email/password against the stored bcrypt hash and returns a JWT bearer token.",
)
def signin(payload: SignInRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    enforce_auth_rate_limit(request)
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=user.id)
    return AuthResponse(token=token, user=UserOut.from_model(user))


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user",
    description="Returns the authenticated user's profile, resolved from the bearer token.",
)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.from_model(current_user)
