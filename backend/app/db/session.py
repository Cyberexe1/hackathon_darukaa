"""SQLAlchemy engine/session setup, compatible with Neon Postgres."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# pool_pre_ping avoids stale-connection errors against Neon's serverless
# Postgres, which can silently close idle connections after a period of
# inactivity (Neon auto-suspends idle compute). A modest pool size is
# appropriate for a single small Render web service instance — this is
# not a high-concurrency deployment, and Neon's own connection limits
# (especially on free/lower tiers) are the real ceiling, so we avoid an
# oversized pool per app instance. pool_recycle proactively refreshes
# connections older than 5 minutes so we don't rely solely on
# pool_pre_ping to catch server-closed connections.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
