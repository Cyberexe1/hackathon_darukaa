"""SQLAlchemy Project model."""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

# Controlled vocabularies. Values match the frontend's `ProjectType` /
# `ProjectStatus` string unions exactly (see frontend/src/types/dashboard.ts)
# so API responses can be consumed by the frontend with no translation.
PROJECT_TYPES = (
    "Forest Restoration",
    "Mangrove",
    "Biodiversity",
    "Agroforestry",
    "Wetland Conservation",
)
PROJECT_STATUSES = ("Active", "Planning", "Completed", "Paused")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    project_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Planning", index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    sites: Mapped[list["Site"]] = relationship(
        "Site", back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )
