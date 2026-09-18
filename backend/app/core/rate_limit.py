"""Lightweight in-memory rate limiting for sensitive auth endpoints
(login, signup).

Deliberately NOT a distributed rate limiter (no Redis/external store) —
this is a single-process in-memory sliding window keyed by client IP.
That's an intentional trade-off: it resets on deploy/restart and doesn't
share state across multiple backend instances, but for this project's
scale (a single Render web service) it adds meaningful brute-force
protection with zero added infrastructure or deployment complexity.

If the app is ever scaled to multiple instances, this should be replaced
with a shared store (e.g. Redis) — noted in the README's trade-offs.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]

        while hits and hits[0] <= now - self.window_seconds:
            hits.popleft()

        if len(hits) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a moment and try again.",
            )

        hits.append(now)


# 10 attempts per minute per IP on login/signup — generous enough for
# normal use (typos, retries) while meaningfully slowing down automated
# credential-stuffing/brute-force attempts.
auth_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)


def enforce_auth_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(client_ip)
