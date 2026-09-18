"""create site_metrics table

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-18
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "site_metrics",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "site_id",
            sa.String(length=36),
            sa.ForeignKey("sites.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("recorded_at", sa.Date(), nullable=False),
        sa.Column("carbon_tco2e", sa.Numeric(14, 2), nullable=False),
        sa.Column("biodiversity_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("vegetation_index", sa.Numeric(4, 3), nullable=False),
        sa.Column("tree_cover_percentage", sa.Numeric(5, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "biodiversity_score >= 0 AND biodiversity_score <= 100", name="ck_site_metrics_biodiversity_range"
        ),
        sa.CheckConstraint(
            "tree_cover_percentage >= 0 AND tree_cover_percentage <= 100", name="ck_site_metrics_tree_cover_range"
        ),
        sa.CheckConstraint("vegetation_index >= 0 AND vegetation_index <= 1", name="ck_site_metrics_vegetation_range"),
        sa.CheckConstraint("carbon_tco2e >= 0", name="ck_site_metrics_carbon_non_negative"),
    )
    op.create_index("ix_site_metrics_site_id", "site_metrics", ["site_id"])
    op.create_index("ix_site_metrics_recorded_at", "site_metrics", ["recorded_at"])
    # Composite index for the common query pattern: "this site's metrics,
    # ordered by date" (time-series reads for charts).
    op.create_index("ix_site_metrics_site_id_recorded_at", "site_metrics", ["site_id", "recorded_at"])


def downgrade() -> None:
    op.drop_index("ix_site_metrics_site_id_recorded_at", table_name="site_metrics")
    op.drop_index("ix_site_metrics_recorded_at", table_name="site_metrics")
    op.drop_index("ix_site_metrics_site_id", table_name="site_metrics")
    op.drop_table("site_metrics")
