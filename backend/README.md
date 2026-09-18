# Darukaa.Earth Backend

FastAPI backend for Darukaa.Earth: JWT auth (bcrypt-hashed passwords) plus
a PostGIS-backed geospatial API for environmental projects and sites.

- `POST /auth/signup`, `POST /auth/signin`, `GET /auth/me` — auth, matches
  `frontend/src/services/authService.ts`.
- `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}` — projects,
  matches `frontend/src/services/projectService.ts`.
- `GET/POST /sites` (supports `?project_id=`), `GET/PATCH/DELETE
  /sites/{id}` — sites, matches `frontend/src/services/siteService.ts`.

## Stack
- FastAPI + Uvicorn
- SQLAlchemy 2.0 + psycopg v3 (Neon-compatible Postgres driver)
- **PostGIS** (via GeoAlchemy2 + Shapely) for site boundary geometry
- bcrypt for password hashing, PyJWT for bearer tokens
- Alembic for migrations

## Geospatial architecture

Every site boundary drawn by a user goes through this pipeline:

```
Mapbox GL Draw (frontend)
  -> GeoJSON Polygon
  -> POST /sites  (Axios, frontend/src/services/siteService.ts)
  -> FastAPI validates the GeoJSON (app/services/geospatial_service.py)
  -> Converted to a Shapely geometry, then a PostGIS geometry(Polygon, 4326)
  -> Stored in Neon Postgres (sites.geometry column)
  -> Area/perimeter/centroid computed authoritatively via PostGIS
     (ST_Area/ST_Perimeter/ST_Centroid on a geography cast)
  -> Returned to the frontend as plain GeoJSON + numeric fields
  -> Rendered on Mapbox GL (MapView.tsx) as a GeoJSON source/layer
```

Key points:
- **The frontend never sends area/perimeter/centroid on create.** Mapbox
  Draw + Turf.js compute a live preview client-side for the Review step
  UX, but only the raw GeoJSON polygon is POSTed. The backend is the sole
  authority on those numbers — it recomputes them from the stored
  geometry via PostGIS, so the values persisted and returned are always
  server-computed, not client-trusted.
- **Geometry is stored as a real PostGIS `geometry(Polygon, 4326)` column**
  (`app/models/site.py`), not as a JSON/text blob. SRID 4326 is WGS84
  lon/lat, matching GeoJSON's coordinate convention.
- **Validation** (`app/services/geospatial_service.py`) checks: geometry
  present, type is `Polygon`, ring is closed, ring has enough points, and
  the resulting Shapely geometry is non-empty, non-zero-area, and
  topologically valid (rejects self-intersecting/malformed rings). Any
  failure returns a `422` with a plain-language message
  (`"Invalid site boundary. Please redraw the polygon."`) — raw
  PostGIS/database errors are never surfaced to the client.
- **Area calculation** casts the geometry to `geography` before calling
  `ST_Area`/`ST_Perimeter`, which gives geodesic (great-circle)
  measurements in square meters/meters rather than planar degrees — this
  matters because a "square degree" varies wildly in real area depending
  on latitude. Area is converted to hectares, perimeter to kilometers.
- **A GiST spatial index** (`ix_sites_geometry`) is created on
  `sites.geometry` in the migration for efficient spatial queries as the
  number of sites grows.
- **Ownership**: `projects.created_by` is a foreign key to `users.id`,
  always set from the JWT-authenticated user server-side — the client can
  never set/override it. Every project/site read/write checks that the
  requesting user owns the parent project (403 if not, 404 if the
  resource doesn't exist at all).

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env: set DATABASE_URL to your Neon connection string and JWT_SECRET
# to a random value, e.g.:
#   python -c "import secrets; print(secrets.token_urlsafe(64))"
```

`DATABASE_URL` must use the `postgresql+psycopg://` scheme, e.g.:

```
postgresql+psycopg://<user>:<password>@<neon-host>/<dbname>?sslmode=require
```

### Required environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (`postgresql+psycopg://...?sslmode=require`) |
| `JWT_SECRET_KEY` | Random secret used to sign JWTs — generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"` (legacy alias `JWT_SECRET` also accepted) |
| `JWT_ALGORITHM` | Defaults to `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Defaults to `1440` (24h) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins. Must not contain `*` when `DEBUG=False` — enforced at startup |
| `DEBUG` | Defaults to `True`. Set `False` in production |
| `ENVIRONMENT` | Defaults to `development`. Informational label surfaced in `/health` and logs |

None of these are hardcoded anywhere in source — they're read from the
environment (via `.env` locally, real environment variables in
production). `.env` is git-ignored; never commit real credentials.

## Run migrations

```powershell
.\.venv\Scripts\alembic upgrade head
```

This applies all migrations, including `0002_postgis_projects_sites.py`,
which runs `CREATE EXTENSION IF NOT EXISTS postgis` (safe/idempotent —
does nothing if PostGIS is already enabled on your database) and creates
the `projects` and `sites` tables with their indexes, including the
spatial GiST index on `sites.geometry`.

Migrations are purely additive — no existing table is dropped or altered
destructively, and the `postgis` extension is never dropped even on
`alembic downgrade`.

## Seed demo data

```powershell
.\.venv\Scripts\python -m app.seed
```

Seeds a demo user (`demo@darukaa.earth` / `DemoPassword123!`) and a
handful of clearly-labeled `[DEMO]` projects and sites with real,
distinct polygons (so their area/perimeter/centroid are genuinely
computed by PostGIS, not hardcoded numbers). **Idempotent and safe**: it
checks whether any project already exists in the database first and
does nothing if so — it will never duplicate data or touch existing
records.

For the seeded `[DEMO]` sites only, it also seeds one `site_metrics` row
per year from 2022 through 2026 (carbon, biodiversity, vegetation index,
tree cover), so the Environmental Analytics page has historical data to
chart out of the box. **These values are explicitly synthetic** — a
smooth illustrative trend, not real measurements of any kind — and the
frontend (`SiteAnalyticsPage.tsx`) shows a visible "Demo data" badge on
every analytics chart for any site whose name starts with `[DEMO]`, so
this is never presented as a real environmental measurement. Real,
non-demo sites created by a signed-in user are never auto-seeded with
metrics — those are entered through the app's own Add Measurement UI.

## Run the dev server

```powershell
.\.venv\Scripts\uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with interactive
docs at `/docs`. Set the frontend's `VITE_API_BASE_URL` to point at this
server (e.g. `http://127.0.0.1:8000`).

## Run tests

```powershell
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m pytest tests/ -v
```

Tests run against the real `DATABASE_URL` (there's no separate test
database configured) — each test signs up its own throwaway user and
cleans it up (cascading to any projects/sites it created) in teardown,
so no test data is left behind. Covers: project creation/retrieval/
authorization, site creation with valid/invalid/missing polygons,
authoritative area calculation, site retrieval/authorization, and
cross-user access denial (403) plus not-found handling (404).

## Security notes
- No secrets or connection strings are hardcoded — `DATABASE_URL` and
  `JWT_SECRET_KEY` are read from environment variables (via `.env` in dev).
- `.env` is git-ignored. Never commit real credentials.
- CORS is restricted to the origins listed in `CORS_ORIGINS` (comma
  separated). A wildcard (`*`) is rejected at startup whenever
  `DEBUG=False` — production must list its exact frontend origin(s).
- Ownership is always derived from the JWT — no endpoint trusts a
  client-supplied user/owner id.
- `/auth/signup` and `/auth/signin` are rate-limited (10 requests/minute
  per IP) to slow down brute-force attempts.
- A catch-all exception handler in `app/main.py` ensures no unhandled
  error ever returns a raw stack trace, SQL error, or file path to the
  client — everything is logged server-side and a generic message is
  returned instead.
- `GET /health` is a fast liveness check; `GET /health/db` verifies the
  database connection without revealing connection details.

## Linting

```powershell
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\ruff check .
.\.venv\Scripts\ruff format --check .
```

## Render deployment

See `render.yaml` at the repo root of this folder. Start command:
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set `DATABASE_URL`
and `CORS_ORIGINS` in Render's environment variable UI — both are left
as `sync: false` in `render.yaml` so they're never committed.
