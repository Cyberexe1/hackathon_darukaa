"""SiteMetric CRUD routes, nested under /sites/{site_id}/metrics.
Authorization/business logic lives in app/services/metric_service.py —
this module only wires HTTP verbs to those calls.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.metric import MetricCreate, MetricOut, MetricUpdate
from app.services import metric_service

router = APIRouter(prefix="/sites/{site_id}/metrics", tags=["metrics"])


@router.get("", response_model=list[MetricOut])
def get_metrics(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MetricOut]:
    return metric_service.list_metrics(db, current_user, site_id)


@router.post("", response_model=MetricOut, status_code=status.HTTP_201_CREATED)
def create_metric(
    site_id: str,
    payload: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MetricOut:
    return metric_service.create_metric(db, current_user, site_id, payload)


@router.patch("/{metric_id}", response_model=MetricOut)
def update_metric(
    site_id: str,
    metric_id: str,
    payload: MetricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MetricOut:
    return metric_service.update_metric(db, current_user, site_id, metric_id, payload)


@router.delete("/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metric(
    site_id: str,
    metric_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    metric_service.delete_metric(db, current_user, site_id, metric_id)
