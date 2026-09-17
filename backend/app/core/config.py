"""Application configuration.

Reads all secrets/connection strings from environment variables (or a local
.env file during development). Nothing sensitive is hardcoded here — the
Neon PostgreSQL connection string and JWT secret must be supplied via env.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Neon Postgres connection string, e.g.
    # postgresql+psycopg://user:password@host/dbname?sslmode=require
    DATABASE_URL: str

    # Secret key used to sign JWTs. Must be a long, random string in production.
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Comma-separated list of allowed CORS origins (the frontend URL(s)).
    CORS_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
