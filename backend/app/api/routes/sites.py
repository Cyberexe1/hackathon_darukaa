"""Site CRUD routes. Geometry validation, PostGIS conversion, and
authoritative area/perimeter/centroid calculation happen in
`app/services/site_service.py` and `app/services/geospatial_service.py` —
this module only wires HTTP verbs/params to those calls.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.site import SiteCreate, SiteOut, SiteUpdate
from app.services import site_service

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[SiteOut])
def get_sites(
    project_id: str | None = Query(default=None, description="Filter sites by project id."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SiteOut]:
    return site_service.list_sites(db, current_user, project_id=project_id)


@router.post("", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteOut:
    return site_service.create_site(db, current_user, payload)


@router.get("/{site_id}", response_model=SiteOut)
def get_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteOut:
    return site_service.get_site(db, current_user, site_id)


@router.patch("/{site_id}", response_model=SiteOut)
def update_site(
    site_id: str,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteOut:
    return site_service.update_site(db, current_user, site_id, payload)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    site_service.delete_site(db, current_user, site_id)
