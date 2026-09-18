"""Business logic for the SiteMetric resource: CRUD + ownership
authorization (via the site's parent project, same pattern as
site_service.py).
"""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site_metric import SiteMetric
from app.models.user import User
from app.schemas.metric import MetricCreate, MetricOut, MetricUpdate
from app.services.authz import get_owned_site_and_project


def _to_out(metric: SiteMetric) -> MetricOut:
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


def list_metrics(db: Session, current_user: User, site_id: str) -> list[MetricOut]:
    get_owned_site_and_project(db, current_user, site_id)
    metrics = (
        db.execute(select(SiteMetric).where(SiteMetric.site_id == site_id).order_by(SiteMetric.recorded_at.asc()))
        .scalars()
        .all()
    )
    return [_to_out(m) for m in metrics]


def create_metric(db: Session, current_user: User, site_id: str, payload: MetricCreate) -> MetricOut:
    get_owned_site_and_project(db, current_user, site_id)

    metric = SiteMetric(
        site_id=site_id,
        recorded_at=payload.recorded_at,
        carbon_tco2e=payload.carbon_tco2e,
        biodiversity_score=payload.biodiversity_score,
        vegetation_index=payload.vegetation_index,
        tree_cover_percentage=payload.tree_cover_percentage,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return _to_out(metric)


def _get_metric_or_404(db: Session, site_id: str, metric_id: str) -> SiteMetric:
    metric = db.get(SiteMetric, metric_id)
    if metric is None or metric.site_id != site_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found.")
    return metric


def update_metric(db: Session, current_user: User, site_id: str, metric_id: str, payload: MetricUpdate) -> MetricOut:
    get_owned_site_and_project(db, current_user, site_id)
    metric = _get_metric_or_404(db, site_id, metric_id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(metric, field, value)

    metric.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(metric)
    return _to_out(metric)


def delete_metric(db: Session, current_user: User, site_id: str, metric_id: str) -> None:
    get_owned_site_and_project(db, current_user, site_id)
    metric = _get_metric_or_404(db, site_id, metric_id)
    db.delete(metric)
    db.commit()
