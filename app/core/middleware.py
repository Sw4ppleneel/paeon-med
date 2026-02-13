from __future__ import annotations

import re
import time
import logging
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

log = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a X-Request-ID header to each request and include it in logs."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(__import__("uuid").uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter keyed by client IP.

    Not suitable for production but fine for a demo/club display.
    """

    def __init__(self, app, calls: int = 120, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self._buckets: dict[str, tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        count, ts = self._buckets.get(ip, (0, now))
        if now - ts > self.period:
            count, ts = 0, now
        count += 1
        self._buckets[ip] = (count, ts)
        if count > self.calls:
            log.warning("Rate limit exceeded for %s (%d/%d)", ip, count, self.calls)
            return JSONResponse({"detail": "rate limit exceeded"}, status_code=429)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add a small set of security-related headers to responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        # Minimal security headers
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=()")
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        # Content Security Policy (very restrictive for demo; adjust as needed)
        csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        response.headers.setdefault("Content-Security-Policy", csp)
        return response
