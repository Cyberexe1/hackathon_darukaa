"""Pydantic schemas for the Site resource, matching the frontend's `Site` /
`CreateSiteInput` contract (see frontend/src/types/dashboard.ts and
frontend/src/services/mock/mockSiteService.ts) — with one deliberate
difference: `area_hectares`/`perimeter_km`/`centroid` are never accepted
from the client on create. They are always recomputed authoritatively by
the backend from the submitted geometry (see
app/services/geospatial_service.py) and returned in the response.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models.site import SITE_STATUSES


class GeoJSONPolygonIn(BaseModel):
    type: str
    coordinates: list[list[list[float]]]

    @field_validator("type")
    @classmethod
    def must_be_polygon(cls, v: str) -> str:
        if v != "Polygon":
            raise ValueError("Invalid site boundary. Please redraw the polygon.")
        return v


class SiteCreate(BaseModel):
    project_id: str
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    status: str = "In Review"
    geometry: GeoJSONPolygonIn

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Site name is required.")
        return v.strip()

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in SITE_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(SITE_STATUSES)}.")
        return v


class SiteUpdate(BaseModel):
    """PATCH semantics — partial update. Geometry may optionally be
    re-drawn/replaced; if provided, area/perimeter/centroid are
    recomputed server-side just like on create.
    """

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    status: str | None = None
    geometry: GeoJSONPolygonIn | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Site name cannot be blank.")
        return v.strip() if v is not None else v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str | None) -> str | None:
        if v is not None and v not in SITE_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(SITE_STATUSES)}.")
        return v


class CentroidOut(BaseModel):
    lat: float
    lon: float


class SiteOut(BaseModel):
    id: str
    project_id: str
    name: str
    description: str
    area_hectares: float
    perimeter_km: float
    centroid: CentroidOut
    geometry: dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
