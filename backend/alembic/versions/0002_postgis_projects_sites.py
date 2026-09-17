"""enable postgis, create projects and sites tables with spatial index

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-17
"""

from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable PostGIS. Safe/idempotent — does nothing if already enabled.
    # Confirmed available on the target Neon Postgres instance (v3.6.4)
    # before writing this migration.
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("project_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="Planning"),
        sa.Column("country", sa.String(length=100), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column(
            "created_by",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_projects_created_by", "projects", ["created_by"])
    op.create_index("ix_projects_status", "projects", ["status"])

    op.create_table(
        "sites",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "project_id",
            sa.String(length=36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="In Review"),
        sa.Column(
            "geometry",
            geoalchemy2.Geometry(geometry_type="POLYGON", srid=4326, spatial_index=False),
            nullable=False,
        ),
        sa.Column("area_hectares", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("perimeter_km", sa.Numeric(14, 3), nullable=False, server_default="0"),
        sa.Column("centroid_lat", sa.Numeric(9, 6), nullable=False, server_default="0"),
        sa.Column("centroid_lon", sa.Numeric(9, 6), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_sites_project_id", "sites", ["project_id"])
    op.create_index("ix_sites_status", "sites", ["status"])

    # Spatial (GiST) index on the geometry column — required for
    # performant spatial queries (bounding-box lookups, ST_Intersects,
    # etc.) as the number of sites grows.
    op.execute("CREATE INDEX ix_sites_geometry ON sites USING GIST (geometry)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_sites_geometry")
    op.drop_index("ix_sites_status", table_name="sites")
    op.drop_index("ix_sites_project_id", table_name="sites")
    op.drop_table("sites")

    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index("ix_projects_created_by", table_name="projects")
    op.drop_table("projects")

    # Deliberately does NOT drop the postgis extension on downgrade —
    # other tables/features may depend on it, and dropping it is a
    # destructive, hard-to-reverse operation outside the scope of this
    # migration's ownership.
