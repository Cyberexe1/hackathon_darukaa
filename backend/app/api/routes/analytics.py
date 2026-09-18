"""Analytics/aggregation routes: per-site analytics (summary + historical
+ performance change), per-project aggregation, and dashboard-wide
overview. All business logic lives in app/services/analytics_service.py.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsOut, ProjectAnalyticsOut, SiteAnalyticsOut
from app.services import analytics_service

router = APIRouter(tags=["analytics"])


@router.get("/sites/{site_id}/analytics", response_model=SiteAnalyticsOut)
def get_site_analytics(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteAnalyticsOut:
    return analytics_service.get_site_analytics(db, current_user, site_id)


@router.get("/projects/{project_id}/analytics", response_model=ProjectAnalyticsOut)
def get_project_analytics(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectAnalyticsOut:
    return analytics_service.get_project_analytics(db, current_user, project_id)


@router.get("/analytics/dashboard", response_model=DashboardAnalyticsOut)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardAnalyticsOut:
    return analytics_service.get_dashboard_analytics(db, current_user)
