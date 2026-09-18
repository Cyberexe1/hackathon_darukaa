"""Business logic for the Site resource: CRUD, geometry validation/
conversion, authoritative spatial measurements, and ownership
authorization (via the parent Project's `created_by`).
"""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.site import CentroidOut, SiteCreate, SiteOut, SiteUpdate
from app.services.geospatial_service import (
    InvalidGeometryError,
    compute_geometry_summary,
    geojson_to_shape,
    shape_to_ewkt_element,
    wkb_to_geojson,
)


def _to_out(site: Site) -> SiteOut:
    return SiteOut(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        description=site.description,
        area_hectares=float(site.area_hectares),
        perimeter_km=float(site.perimeter_km),
        centroid=CentroidOut(lat=float(site.centroid_lat), lon=float(site.centroid_lon)),
        geometry=wkb_to_geojson(site.geometry),
        status=site.status,
        created_at=site.created_at,
        updated_at=site.updated_at,
    )


def _get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


def _get_site_or_404(db: Session, site_id: str) -> Site:
    site = db.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
    return site


def _authorize_project_owner(project: Project, current_user: User) -> None:
    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this site.",
        )


def list_sites(db: Session, current_user: User, project_id: str | None = None) -> list[SiteOut]:
    """Returns sites belonging to projects owned by the current user,
    optionally filtered to a single project. Uses a single JOIN against
    Project to enforce ownership without an N+1 per-site lookup.
    """
    stmt = select(Site).join(Project, Project.id == Site.project_id).where(Project.created_by == current_user.id)
    if project_id is not None:
        stmt = stmt.where(Site.project_id == project_id)
    stmt = stmt.order_by(Site.created_at.desc())

    sites = db.execute(stmt).scalars().all()
    return [_to_out(site) for site in sites]


def get_site(db: Session, current_user: User, site_id: str) -> SiteOut:
    site = _get_site_or_404(db, site_id)
    project = _get_project_or_404(db, site.project_id)
    _authorize_project_owner(project, current_user)
    return _to_out(site)


def create_site(db: Session, current_user: User, payload: SiteCreate) -> SiteOut:
    project = _get_project_or_404(db, payload.project_id)
    _authorize_project_owner(project, current_user)

    try:
        geom = geojson_to_shape(payload.geometry.model_dump())
    except InvalidGeometryError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    summary = compute_geometry_summary(db, geom)

    site = Site(
        project_id=payload.project_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        geometry=shape_to_ewkt_element(geom),
        area_hectares=summary.area_hectares,
        perimeter_km=summary.perimeter_km,
        centroid_lat=summary.centroid_lat,
        centroid_lon=summary.centroid_lon,
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return _to_out(site)


def update_site(db: Session, current_user: User, site_id: str, payload: SiteUpdate) -> SiteOut:
    site = _get_site_or_404(db, site_id)
    project = _get_project_or_404(db, site.project_id)
    _authorize_project_owner(project, current_user)

    updates = payload.model_dump(exclude_unset=True, exclude={"geometry"})
    for field, value in updates.items():
        setattr(site, field, value)

    if payload.geometry is not None:
        try:
            geom = geojson_to_shape(payload.geometry.model_dump())
        except InvalidGeometryError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        summary = compute_geometry_summary(db, geom)
        site.geometry = shape_to_ewkt_element(geom)
        site.area_hectares = summary.area_hectares
        site.perimeter_km = summary.perimeter_km
        site.centroid_lat = summary.centroid_lat
        site.centroid_lon = summary.centroid_lon

    site.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(site)
    return _to_out(site)


def delete_site(db: Session, current_user: User, site_id: str) -> None:
    site = _get_site_or_404(db, site_id)
    project = _get_project_or_404(db, site.project_id)
    _authorize_project_owner(project, current_user)
    db.delete(site)
    db.commit()
