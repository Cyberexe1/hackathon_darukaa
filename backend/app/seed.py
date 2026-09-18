"""Safe demo data seeder.

Run with:
    python -m app.seed

Behavior:
- Only seeds if the database is currently empty of projects (i.e. this
  script is idempotent and safe to re-run — it will never duplicate data
  or touch existing projects/sites/users).
- Creates one demo user (or reuses it if it already exists by email) plus
  several projects, each with a few sites with real, valid, distinct
  polygons so their PostGIS-computed area/perimeter/centroid values are
  genuine, not hardcoded.
- All data is clearly labeled as demo data in its names/descriptions. No
  fabricated carbon/biodiversity/environmental measurements are included
  — this seeds only the geospatial project/site foundation, consistent
  with the rest of this feature.
"""

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.services.geospatial_service import compute_geometry_summary, geojson_to_shape, shape_to_ewkt_element

DEMO_EMAIL = "demo@darukaa.earth"
DEMO_PASSWORD = "DemoPassword123!"
DEMO_NAME = "Darukaa Demo"


def _polygon(coords: list[list[float]]) -> dict:
    ring = coords + [coords[0]]
    return {"type": "Polygon", "coordinates": [ring]}


DEMO_PROJECTS: list[dict] = [
    {
        "name": "[DEMO] Western Ghats Forest Restoration",
        "description": "Demo project seeded for evaluation purposes — not a real restoration initiative.",
        "project_type": "Forest Restoration",
        "status": "Active",
        "country": "India",
        "region": "Maharashtra",
        "start_date": "2024-02-01",
        "end_date": None,
        "sites": [
            {
                "name": "[DEMO] Site A — Ridge Block",
                "description": "Demo site boundary.",
                "status": "Active",
                "geometry": _polygon([[73.40, 18.90], [73.42, 18.90], [73.42, 18.92], [73.40, 18.92]]),
            },
            {
                "name": "[DEMO] Site B — Valley Block",
                "description": "Demo site boundary.",
                "status": "Verified",
                "geometry": _polygon([[73.44, 18.88], [73.47, 18.88], [73.47, 18.90], [73.44, 18.90]]),
            },
        ],
    },
    {
        "name": "[DEMO] Sundarbans Mangrove Rehabilitation",
        "description": "Demo project seeded for evaluation purposes — not a real restoration initiative.",
        "project_type": "Mangrove",
        "status": "Planning",
        "country": "India",
        "region": "West Bengal",
        "start_date": "2025-06-01",
        "end_date": None,
        "sites": [
            {
                "name": "[DEMO] Delta Plot 1",
                "description": "Demo site boundary.",
                "status": "In Review",
                "geometry": _polygon([[88.80, 21.90], [88.83, 21.90], [88.83, 21.93], [88.80, 21.93]]),
            },
        ],
    },
    {
        "name": "[DEMO] Deccan Agroforestry Initiative",
        "description": "Demo project seeded for evaluation purposes — not a real restoration initiative.",
        "project_type": "Agroforestry",
        "status": "Paused",
        "country": "India",
        "region": "Karnataka",
        "start_date": "2023-09-15",
        "end_date": "2025-03-01",
        "sites": [],
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        existing_projects = db.query(Project).count()
        if existing_projects > 0:
            print(f"Database already has {existing_projects} project(s) — skipping seed (idempotent, no-op).")
            return

        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if user is None:
            user = User(
                name=DEMO_NAME,
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                role="manager",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {DEMO_EMAIL} (password: {DEMO_PASSWORD})")
        else:
            print(f"Reusing existing demo user: {DEMO_EMAIL}")

        for project_data in DEMO_PROJECTS:
            sites_data = project_data.pop("sites")
            project = Project(created_by=user.id, **project_data)
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"Created project: {project.name}")

            for site_data in sites_data:
                geom = geojson_to_shape(site_data["geometry"])
                summary = compute_geometry_summary(db, geom)
                site = Site(
                    project_id=project.id,
                    name=site_data["name"],
                    description=site_data["description"],
                    status=site_data["status"],
                    geometry=shape_to_ewkt_element(geom),
                    area_hectares=summary.area_hectares,
                    perimeter_km=summary.perimeter_km,
                    centroid_lat=summary.centroid_lat,
                    centroid_lon=summary.centroid_lon,
                )
                db.add(site)
                db.commit()
                print(f"  Created site: {site.name} ({summary.area_hectares} ha)")

        print("\nSeed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
