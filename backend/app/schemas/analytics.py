"""Pydantic response schemas for the analytics endpoints: per-site
analytics (summary + historical time series + performance change),
per-project aggregation, and the dashboard-wide overview.

None of these schemas accept client input — they're all response-only
shapes assembled by `app/services/analytics_service.py` from real stored
data. No environmental figure is ever fabricated: fields are `None`
("no data") when there simply isn't enough history to compute them,
never a made-up placeholder number.
"""

from datetime import date

from pydantic import BaseModel

from app.schemas.metric import MetricOut


class SiteAnalyticsSiteOut(BaseModel):
    id: str
    name: str
    area_hectares: float
    status: str


class SiteAnalyticsSummaryOut(BaseModel):
    """Latest-known values, or `None` if no metrics exist yet."""

    carbon_total: float | None
    biodiversity_current: float | None
    vegetation_current: float | None
    tree_cover_current: float | None
    first_recorded_at: date | None
    last_recorded_at: date | None


class PerformanceChangeOut(BaseModel):
    """Percent change between the earliest and latest measurement in the
    selected time range. `None` for any field (and `has_sufficient_data =
    False`) when fewer than two data points are available — the frontend
    must render "Insufficient historical data" rather than a fabricated
    percentage in that case.
    """

    has_sufficient_data: bool
    carbon_change_pct: float | None
    biodiversity_change_pct: float | None
    vegetation_change_pct: float | None
    tree_cover_change_pct: float | None


class SiteAnalyticsOut(BaseModel):
    site: SiteAnalyticsSiteOut
    summary: SiteAnalyticsSummaryOut
    performance: PerformanceChangeOut
    # Sorted ascending by recorded_at. Empty list, not fabricated
    # placeholder rows, when the site has no metrics.
    historical: list[MetricOut]


class YearAggregatePointOut(BaseModel):
    """One bucketed year of aggregated metrics across multiple sites
    (sum for carbon, average for the rest) — used for project-level and
    dashboard-level historical trend charts, where records from different
    sites rarely share an exact date.
    """

    year: int
    carbon_tco2e: float
    biodiversity_score: float
    vegetation_index: float
    tree_cover_percentage: float


class ProjectAnalyticsProjectOut(BaseModel):
    id: str
    name: str
    site_count: int
    total_area_hectares: float
    status: str


class ProjectAnalyticsSummaryOut(BaseModel):
    carbon_total: float | None
    avg_biodiversity_score: float | None
    avg_vegetation_index: float | None
    avg_tree_cover_percentage: float | None


class ProjectAnalyticsOut(BaseModel):
    project: ProjectAnalyticsProjectOut
    summary: ProjectAnalyticsSummaryOut
    historical: list[YearAggregatePointOut]


class DashboardAnalyticsOut(BaseModel):
    total_projects: int
    total_sites: int
    total_area_hectares: float
    active_sites: int
    carbon_total: float | None
    avg_biodiversity_score: float | None
    avg_vegetation_index: float | None
    avg_tree_cover_percentage: float | None
    historical: list[YearAggregatePointOut]
