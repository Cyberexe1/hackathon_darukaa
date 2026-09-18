"""Aggregation/analytics logic for sites, projects, and the dashboard.

All figures are computed from real stored `site_metrics` rows — nothing
here fabricates environmental data. Where there isn't enough history to
compute a meaningful figure (e.g. a percent change with fewer than two
data points), the corresponding field is `None` rather than a placeholder
number, and callers (routes/frontend) are expected to render "No data
available" / "Insufficient historical data" instead of a chart or KPI.
"""

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.site_metric import SiteMetric
from app.models.user import User
from app.schemas.analytics import (
    DashboardAnalyticsOut,
    PerformanceChangeOut,
    ProjectAnalyticsOut,
    ProjectAnalyticsProjectOut,
    ProjectAnalyticsSummaryOut,
    SiteAnalyticsOut,
    SiteAnalyticsSiteOut,
    SiteAnalyticsSummaryOut,
    YearAggregatePointOut,
)
from app.schemas.metric import MetricOut
from app.services.authz import authorize_project_owner, get_owned_site_and_project, get_project_or_404


def _pct_change(first: float, last: float) -> float | None:
    if first == 0:
        # Avoid divide-by-zero; an increase from a true zero baseline
        # isn't expressible as a finite percentage.
        return None
    return round(((last - first) / abs(first)) * 100, 1)


def _metric_to_out(metric: SiteMetric) -> MetricOut:
    return MetricOut(
        id=metric.id,
        site_id=metric.site_id,
        recorded_at=metric.recorded_at,
        carbon_tco2e=float(metric.carbon_tco2e),
        biodiversity_score=float(metric.biodiversity_score),
        vegetation_index=float(metric.vegetation_index),
        tree_cover_percentage=float(metric.tree_cover_percentage),
        created_at=metric.created_at,
        updated_at=metric.updated_at,
    )


def get_site_analytics(db: Session, current_user: User, site_id: str) -> SiteAnalyticsOut:
    site, _project = get_owned_site_and_project(db, current_user, site_id)

    metrics = (
        db.execute(select(SiteMetric).where(SiteMetric.site_id == site_id).order_by(SiteMetric.recorded_at.asc()))
        .scalars()
        .all()
    )

    site_out = SiteAnalyticsSiteOut(
        id=site.id, name=site.name, area_hectares=float(site.area_hectares), status=site.status
    )

    if not metrics:
        return SiteAnalyticsOut(
            site=site_out,
            summary=SiteAnalyticsSummaryOut(
                carbon_total=None,
                biodiversity_current=None,
                vegetation_current=None,
                tree_cover_current=None,
                first_recorded_at=None,
                last_recorded_at=None,
            ),
            performance=PerformanceChangeOut(
                has_sufficient_data=False,
                carbon_change_pct=None,
                biodiversity_change_pct=None,
                vegetation_change_pct=None,
                tree_cover_change_pct=None,
            ),
            historical=[],
        )

    latest = metrics[-1]
    earliest = metrics[0]

    summary = SiteAnalyticsSummaryOut(
        carbon_total=float(latest.carbon_tco2e),
        biodiversity_current=float(latest.biodiversity_score),
        vegetation_current=float(latest.vegetation_index),
        tree_cover_current=float(latest.tree_cover_percentage),
        first_recorded_at=earliest.recorded_at,
        last_recorded_at=latest.recorded_at,
    )

    if len(metrics) < 2:
        performance = PerformanceChangeOut(
            has_sufficient_data=False,
            carbon_change_pct=None,
            biodiversity_change_pct=None,
            vegetation_change_pct=None,
            tree_cover_change_pct=None,
        )
    else:
        performance = PerformanceChangeOut(
            has_sufficient_data=True,
            carbon_change_pct=_pct_change(float(earliest.carbon_tco2e), float(latest.carbon_tco2e)),
            biodiversity_change_pct=_pct_change(float(earliest.biodiversity_score), float(latest.biodiversity_score)),
            vegetation_change_pct=_pct_change(float(earliest.vegetation_index), float(latest.vegetation_index)),
            tree_cover_change_pct=_pct_change(
                float(earliest.tree_cover_percentage), float(latest.tree_cover_percentage)
            ),
        )

    return SiteAnalyticsOut(
        site=site_out,
        summary=summary,
        performance=performance,
        historical=[_metric_to_out(m) for m in metrics],
    )


def _year_aggregates_for_site_ids(db: Session, site_ids: list[str]) -> list[YearAggregatePointOut]:
    if not site_ids:
        return []

    year_col = extract("year", SiteMetric.recorded_at)
    rows = db.execute(
        select(
            year_col.label("year"),
            func.sum(SiteMetric.carbon_tco2e).label("carbon_tco2e"),
            func.avg(SiteMetric.biodiversity_score).label("biodiversity_score"),
            func.avg(SiteMetric.vegetation_index).label("vegetation_index"),
            func.avg(SiteMetric.tree_cover_percentage).label("tree_cover_percentage"),
        )
        .where(SiteMetric.site_id.in_(site_ids))
        .group_by(year_col)
        .order_by(year_col.asc())
    ).all()

    return [
        YearAggregatePointOut(
            year=int(row.year),
            carbon_tco2e=round(float(row.carbon_tco2e or 0), 2),
            biodiversity_score=round(float(row.biodiversity_score or 0), 2),
            vegetation_index=round(float(row.vegetation_index or 0), 3),
            tree_cover_percentage=round(float(row.tree_cover_percentage or 0), 2),
        )
        for row in rows
    ]


def get_project_analytics(db: Session, current_user: User, project_id: str) -> ProjectAnalyticsOut:
    project = get_project_or_404(db, project_id)
    authorize_project_owner(project, current_user, resource="project")

    site_rows = db.execute(select(Site.id, Site.area_hectares).where(Site.project_id == project_id)).all()
    site_ids = [row.id for row in site_rows]
    total_area = sum(float(row.area_hectares) for row in site_rows)

    project_out = ProjectAnalyticsProjectOut(
        id=project.id,
        name=project.name,
        site_count=len(site_ids),
        total_area_hectares=round(total_area, 2),
        status=project.status,
    )

    if not site_ids:
        return ProjectAnalyticsOut(
            project=project_out,
            summary=ProjectAnalyticsSummaryOut(
                carbon_total=None,
                avg_biodiversity_score=None,
                avg_vegetation_index=None,
                avg_tree_cover_percentage=None,
            ),
            historical=[],
        )

    agg = db.execute(
        select(
            func.sum(SiteMetric.carbon_tco2e).label("carbon_total"),
            func.avg(SiteMetric.biodiversity_score).label("avg_biodiversity_score"),
            func.avg(SiteMetric.vegetation_index).label("avg_vegetation_index"),
            func.avg(SiteMetric.tree_cover_percentage).label("avg_tree_cover_percentage"),
        ).where(SiteMetric.site_id.in_(site_ids))
    ).first()

    has_any_metrics = agg is not None and agg.carbon_total is not None

    summary = ProjectAnalyticsSummaryOut(
        carbon_total=round(float(agg.carbon_total), 2) if has_any_metrics else None,
        avg_biodiversity_score=round(float(agg.avg_biodiversity_score), 2) if has_any_metrics else None,
        avg_vegetation_index=round(float(agg.avg_vegetation_index), 3) if has_any_metrics else None,
        avg_tree_cover_percentage=round(float(agg.avg_tree_cover_percentage), 2) if has_any_metrics else None,
    )

    historical = _year_aggregates_for_site_ids(db, site_ids)

    return ProjectAnalyticsOut(project=project_out, summary=summary, historical=historical)


def get_dashboard_analytics(db: Session, current_user: User) -> DashboardAnalyticsOut:
    """Aggregates across every project/site owned by the current user."""
    project_agg = db.execute(select(func.count(Project.id)).where(Project.created_by == current_user.id)).scalar() or 0

    site_rows = db.execute(
        select(Site.id, Site.area_hectares, Site.status)
        .join(Project, Project.id == Site.project_id)
        .where(Project.created_by == current_user.id)
    ).all()
    site_ids = [row.id for row in site_rows]
    total_area = sum(float(row.area_hectares) for row in site_rows)
    active_sites = sum(1 for row in site_rows if row.status in ("Active", "Verified"))

    if not site_ids:
        return DashboardAnalyticsOut(
            total_projects=project_agg,
            total_sites=0,
            total_area_hectares=round(total_area, 2),
            active_sites=active_sites,
            carbon_total=None,
            avg_biodiversity_score=None,
            avg_vegetation_index=None,
            avg_tree_cover_percentage=None,
            historical=[],
        )

    agg = db.execute(
        select(
            func.sum(SiteMetric.carbon_tco2e).label("carbon_total"),
            func.avg(SiteMetric.biodiversity_score).label("avg_biodiversity_score"),
            func.avg(SiteMetric.vegetation_index).label("avg_vegetation_index"),
            func.avg(SiteMetric.tree_cover_percentage).label("avg_tree_cover_percentage"),
        ).where(SiteMetric.site_id.in_(site_ids))
    ).first()

    has_any_metrics = agg is not None and agg.carbon_total is not None

    historical = _year_aggregates_for_site_ids(db, site_ids)

    return DashboardAnalyticsOut(
        total_projects=project_agg,
        total_sites=len(site_ids),
        total_area_hectares=round(total_area, 2),
        active_sites=active_sites,
        carbon_total=round(float(agg.carbon_total), 2) if has_any_metrics else None,
        avg_biodiversity_score=round(float(agg.avg_biodiversity_score), 2) if has_any_metrics else None,
        avg_vegetation_index=round(float(agg.avg_vegetation_index), 3) if has_any_metrics else None,
        avg_tree_cover_percentage=round(float(agg.avg_tree_cover_percentage), 2) if has_any_metrics else None,
        historical=historical,
    )
