"""Application logging configuration.

Logs request failures, unhandled exceptions, and important lifecycle
events to stdout (captured by Render/any platform's log aggregation).

Never logs: passwords, JWT tokens/Authorization headers, database
credentials, or full request/response bodies — only structured,
non-sensitive metadata (method, path, status code, exception type).
"""

import logging
import sys

_CONFIGURED = False


def configure_logging(level: str = "INFO") -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    root = logging.getLogger()
    root.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(fmt="%(asctime)s %(levelname)s %(name)s :: %(message)s", datefmt="%Y-%m-%dT%H:%M:%S%z")
    )
    root.handlers = [handler]

    # Quiet down noisy third-party loggers that would otherwise flood
    # stdout with per-request access logs already covered by uvicorn's
    # own access log.
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    _CONFIGURED = True


logger = logging.getLogger("darukaa")
