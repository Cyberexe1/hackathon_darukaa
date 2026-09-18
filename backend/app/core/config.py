"""Application configuration.

Reads all secrets/connection strings from environment variables (or a local
.env file during development). Nothing sensitive is hardcoded here — the
Neon PostgreSQL connection string and JWT secret must be supplied via env.

Never exposed to the frontend: DATABASE_URL, JWT_SECRET_KEY, and any other
value in this file. The frontend only ever receives VITE_-prefixed build
time variables (VITE_API_URL, VITE_MAPBOX_TOKEN), which are a completely
separate config surface in frontend/.env* — see frontend/README.md.
"""

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Neon Postgres connection string, e.g.
    # postgresql+psycopg://user:password@host/dbname?sslmode=require
    DATABASE_URL: str

    # Secret key used to sign JWTs. Must be a long, random string in
    # production — never commit a real value or log it anywhere.
    # `JWT_SECRET_KEY` is the canonical name; `JWT_SECRET` is accepted as a
    # backward-compatible alias for existing deployments/.env files.
    JWT_SECRET_KEY: str = Field(validation_alias=AliasChoices("JWT_SECRET_KEY", "JWT_SECRET"))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Comma-separated list of allowed CORS origins (the frontend URL(s)).
    # Never use "*" here in production — see cors_origins_list below.
    CORS_ORIGINS: str = "http://localhost:5173"

    # Standard production flag. Disables debug-only behavior (verbose
    # error detail, etc.) when false. Defaults to True for local dev.
    DEBUG: bool = True

    # Environment label, purely informational (used in /health and logs).
    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if "*" in origins and not self.DEBUG:
            # Refuse to run a production deployment with a wildcard CORS
            # origin — this would allow any website to call the API with
            # credentials. Fail loudly at startup rather than silently
            # accepting an insecure configuration.
            raise ValueError(
                "CORS_ORIGINS must not contain '*' when DEBUG=False. "
                "Set it to the exact frontend origin(s), e.g. "
                "https://your-app.vercel.app"
            )
        return origins


settings = Settings()
