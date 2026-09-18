"""Pydantic schemas for the SiteMetric resource, matching the frontend's
`SiteMetric` type (see frontend/src/types/dashboard.ts) plus the create/
update payloads used by the Add/Edit Measurement UI.
"""

from datetime import date, datetime

from pydantic import BaseModel, Field


class MetricCreate(BaseModel):
    recorded_at: date
    carbon_tco2e: float = Field(ge=0, description="Carbon sequestration/impact in tCO2e. Cannot be negative.")
    biodiversity_score: float = Field(ge=0, le=100, description="Biodiversity score, 0-100.")
    vegetation_index: float = Field(ge=0, le=1, description="Normalized vegetation index (e.g. NDVI-like), 0-1.")
    tree_cover_percentage: float = Field(ge=0, le=100, description="Tree cover percentage, 0-100.")


class MetricUpdate(BaseModel):
    """PATCH semantics — partial update. Same validation ranges as create."""

    recorded_at: date | None = None
    carbon_tco2e: float | None = Field(default=None, ge=0)
    biodiversity_score: float | None = Field(default=None, ge=0, le=100)
    vegetation_index: float | None = Field(default=None, ge=0, le=1)
    tree_cover_percentage: float | None = Field(default=None, ge=0, le=100)


class MetricOut(BaseModel):
    id: str
    site_id: str
    recorded_at: date
    carbon_tco2e: float
    biodiversity_score: float
    vegetation_index: float
    tree_cover_percentage: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
