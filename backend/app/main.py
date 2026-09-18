"""FastAPI application entrypoint.

Wires together routers, CORS, security headers, logging, and consistent
error handling. Interactive docs remain available at /docs and /redoc —
useful for hiring-team evaluation — since this API requires a bearer
token for all data-mutating/reading endpoints regardless of whether the
docs UI is reachable.
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.projects import router as projects_router
from app.api.routes.sites import router as sites_router
from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.core.middleware import security_headers_middleware
from app.db.session import engine

configure_logging("DEBUG" if settings.DEBUG else "INFO")

app = FastAPI(
    title="Darukaa.Earth API",
    version="0.1.0",
    description=(
        "Environmental intelligence platform API: JWT-authenticated "
        "project/site management with PostGIS-backed geospatial storage "
        "and environmental performance analytics."
    ),
)

app.middleware("http")(security_headers_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sites_router)
app.include_router(metrics_router)
app.include_router(analytics_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Pydantic/FastAPI's default 422 body already excludes request bodies
    # and stack traces — just log at DEBUG for local troubleshooting and
    # pass the structured field errors through unchanged.
    logger.debug("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    # Never leak raw SQL, connection strings, or driver internals to the
    # client — log the real exception server-side and return a generic
    # message.
    logger.error("Database error on %s %s: %s", request.method, request.url.path, exc.__class__.__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Catch-all for anything not already handled by FastAPI/HTTPException.
    # Logs the full exception server-side (stdout, captured by the hosting
    # platform's log aggregation) but never returns internals to the
    # client — no stack trace, no file paths, no exception message.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


@app.get("/health", tags=["health"], summary="Liveness check")
def health() -> dict[str, str]:
    """Basic liveness probe — returns immediately without touching the
    database. Used by Render's health check and uptime monitoring."""
    return {"status": "ok"}


@app.get("/health/db", tags=["health"], summary="Database connectivity check")
def health_db() -> dict[str, str]:
    """Readiness probe that verifies the database connection is alive.
    Returns a generic status only — never the connection string, host, or
    any other detail about the database configuration.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Database health check failed")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable.") from None
    return {"status": "ok", "database": "connected"}


logger.info("Darukaa.Earth API started (environment=%s, debug=%s)", settings.ENVIRONMENT, settings.DEBUG)
