"""SQLAlchemy SiteMetric model — historical environmental measurements for
a site (carbon sequestration, biodiversity score, vegetation index, tree
cover percentage). One site can have many metric records over time,
matching the frontend's `SiteMetric`/`MetricYearPoint` series shape (see
frontend/src/types/dashboard.ts).
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class SiteMetric(Base):
    __tablename__ = "site_metrics"
    __table_args__ = (
        CheckConstraint(
            "biodiversity_score >= 0 AND biodiversity_score <= 100", name="ck_site_metrics_biodiversity_range"
        ),
        CheckConstraint(
            "tree_cover_percentage >= 0 AND tree_cover_percentage <= 100", name="ck_site_metrics_tree_cover_range"
        ),
        CheckConstraint("vegetation_index >= 0 AND vegetation_index <= 1", name="ck_site_metrics_vegetation_range"),
        CheckConstraint("carbon_tco2e >= 0", name="ck_site_metrics_carbon_non_negative"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # The date the measurement represents (not necessarily "today" —
    # historical/backfilled records are expected). NUMERIC (not FLOAT) is
    # used for all measurement columns since these are precise recorded
    # quantities, not approximations where float rounding is acceptable.
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    carbon_tco2e: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    biodiversity_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    vegetation_index: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    tree_cover_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    site: Mapped["Site"] = relationship("Site", back_populates="metrics")
