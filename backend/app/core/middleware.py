"""Security headers middleware.

Adds a small, conservative set of HTTP security headers that don't
interfere with normal API usage, Mapbox tiles, or the FastAPI docs UI.
Deliberately does NOT set a restrictive Content-Security-Policy here —
this is a JSON API (not serving HTML/JS to browsers directly other than
/docs), and an overly strict CSP would break the Swagger UI's own
inline scripts/styles without providing meaningful protection for an API
backend. CORS (configured separately in main.py) is the primary browser
same-origin control for this service.
"""

from collections.abc import Awaitable, Callable

from starlette.requests import Request
from starlette.responses import Response


async def security_headers_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    return response
