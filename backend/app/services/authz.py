"""Shared ownership/authorization helpers for resources scoped under a
Project (sites, metrics, analytics, ...). Centralizing here avoids
duplicating the same "does this project belong to the current user"
check across every new service module. `project_service.py` and
`site_service.py` predate this module and have their own private
equivalents — left untouched since they're already tested; new modules
(metrics, analytics) use this shared version.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.user import User


def get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


def get_site_or_404(db: Session, site_id: str) -> Site:
    site = db.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
    return site


def authorize_project_owner(project: Project, current_user: User, *, resource: str = "resource") -> None:
    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to access this {resource}.",
        )


def get_owned_site_and_project(db: Session, current_user: User, site_id: str) -> tuple[Site, Project]:
    """Fetches a site and its parent project, raising 404 if either is
    missing and 403 if the current user doesn't own the parent project.
    The client's JWT-derived `current_user` is always the source of
    truth — no user id is ever accepted from the request body/params.
    """
    site = get_site_or_404(db, site_id)
    project = get_project_or_404(db, site.project_id)
    authorize_project_owner(project, current_user, resource="site")
    return site, project
