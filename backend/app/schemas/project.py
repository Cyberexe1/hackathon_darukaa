"""Pydantic schemas for the Project resource, matching the frontend's
`Project` / `CreateProjectInput` contract exactly (see
frontend/src/types/dashboard.ts and frontend/src/services/mock/mockProjectService.ts).
"""

from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.project import PROJECT_STATUSES, PROJECT_TYPES


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    project_type: str
    status: str = "Planning"
    country: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=100)
    start_date: date
    end_date: date | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Project name is required.")
        return v.strip()

    @field_validator("project_type")
    @classmethod
    def valid_project_type(cls, v: str) -> str:
        if v not in PROJECT_TYPES:
            raise ValueError(f"Invalid project type. Must be one of: {', '.join(PROJECT_TYPES)}.")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in PROJECT_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(PROJECT_STATUSES)}.")
        return v

    @field_validator("country", "region")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("This field is required.")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v: date | None, info) -> date | None:
        start = info.data.get("start_date")
        if v is not None and start is not None and v < start:
            raise ValueError("End date cannot be before the start date.")
        return v


class ProjectUpdate(BaseModel):
    """All fields optional — PATCH semantics, partial update."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    project_type: str | None = None
    status: str | None = None
    country: str | None = Field(default=None, min_length=1, max_length=100)
    region: str | None = Field(default=None, min_length=1, max_length=100)
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Project name cannot be blank.")
        return v.strip() if v is not None else v

    @field_validator("project_type")
    @classmethod
    def valid_project_type(cls, v: str | None) -> str | None:
        if v is not None and v not in PROJECT_TYPES:
            raise ValueError(f"Invalid project type. Must be one of: {', '.join(PROJECT_TYPES)}.")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str | None) -> str | None:
        if v is not None and v not in PROJECT_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(PROJECT_STATUSES)}.")
        return v


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    project_type: str
    status: str
    country: str
    region: str
    start_date: date
    end_date: date | None
    site_count: int
    total_area_hectares: float
    updated_at: datetime

    model_config = {"from_attributes": True}
