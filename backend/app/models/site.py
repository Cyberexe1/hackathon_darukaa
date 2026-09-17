"""SQLAlchemy Site model, backed by a PostGIS POLYGON geometry column."""

import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

# Matches the frontend's `SiteStatus` string union exactly (see
# frontend/src/types/dashboard.ts) so API responses need no translation.
SITE_STATUSES = ("Active", "Verified", "In Review", "Paused")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="In Review", index=True)

    # Authoritative boundary geometry. SRID 4326 = WGS84 lon/lat, matching
    # GeoJSON's coordinate convention. `geoalchemy2.Geometry` maps this onto
    # PostGIS's native `geometry(Polygon, 4326)` column type.
    geometry: Mapped[object] = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)

    # Backend-computed (never trusted from the client) — see
    # app/services/geospatial_service.py. Stored for fast list/KPI reads
    # without recomputing from geometry on every request.
    area_hectares: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    perimeter_km: Mapped[float] = mapped_column(Numeric(14, 3), nullable=False, default=0)
    centroid_lat: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False, default=0)
    centroid_lon: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    project: Mapped["Project"] = relationship("Project", back_populates="sites")
