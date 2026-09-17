"""Business logic for the Project resource: CRUD + ownership authorization.

Route handlers stay thin (parse request, call service, return response);
all query/authorization logic lives here so it's independently testable.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate


def _to_out(project: Project, site_count: int, total_area_hectares: float) -> ProjectOut:
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        project_type=project.project_type,
        status=project.status,
        country=project.country,
        region=project.region,
        start_date=project.start_date,
        end_date=project.end_date,
        site_count=site_count,
        total_area_hectares=round(float(total_area_hectares or 0), 2),
        updated_at=project.updated_at,
    )


def list_projects(db: Session, current_user: User) -> list[ProjectOut]:
    """Returns all projects owned by the current user, with site_count and
    total_area_hectares computed via a single aggregated LEFT JOIN query
    (avoids N+1 — one query total, not one-per-project).
    """
    rows = db.execute(
        select(
            Project,
            func.count(Site.id).label("site_count"),
            func.coalesce(func.sum(Site.area_hectares), 0).label("total_area_hectares"),
        )
        .outerjoin(Site, Site.project_id == Project.id)
        .where(Project.created_by == current_user.id)
        .group_by(Project.id)
        .order_by(Project.updated_at.desc())
    ).all()

    return [_to_out(project, site_count, total_area_hectares) for project, site_count, total_area_hectares in rows]


def get_project(db: Session, current_user: User, project_id: str) -> ProjectOut:
    row = db.execute(
        select(
            Project,
            func.count(Site.id).label("site_count"),
            func.coalesce(func.sum(Site.area_hectares), 0).label("total_area_hectares"),
        )
        .outerjoin(Site, Site.project_id == Project.id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    ).first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    project, site_count, total_area_hectares = row
    _authorize_owner(project, current_user)
    return _to_out(project, site_count, total_area_hectares)


def _get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


def _authorize_owner(project: Project, current_user: User) -> None:
    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this project.",
        )


def create_project(db: Session, current_user: User, payload: ProjectCreate) -> ProjectOut:
    project = Project(
        name=payload.name,
        description=payload.description,
        project_type=payload.project_type,
        status=payload.status,
        country=payload.country,
        region=payload.region,
        start_date=payload.start_date,
        end_date=payload.end_date,
        created_by=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_out(project, site_count=0, total_area_hectares=0)


def update_project(db: Session, current_user: User, project_id: str, payload: ProjectUpdate) -> ProjectOut:
    project = _get_project_or_404(db, project_id)
    _authorize_owner(project, current_user)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(project, field, value)

    if project.end_date is not None and project.start_date is not None and project.end_date < project.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="End date cannot be before the start date.",
        )

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)

    site_count = db.scalar(select(func.count(Site.id)).where(Site.project_id == project.id)) or 0
    total_area = db.scalar(select(func.coalesce(func.sum(Site.area_hectares), 0)).where(Site.project_id == project.id)) or 0
    return _to_out(project, site_count, total_area)


def delete_project(db: Session, current_user: User, project_id: str) -> None:
    project = _get_project_or_404(db, project_id)
    _authorize_owner(project, current_user)
    db.delete(project)
    db.commit()
