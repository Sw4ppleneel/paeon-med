"""Paeon DMR Backend — FastAPI entry point.

Digital Medical Representative system by Indegene for Cipla.
Compliance-first, B2B-only pharmaceutical intelligence platform.

Run with: uvicorn main:app --reload

TODO: Add rate limiting middleware.
TODO: Add request ID middleware for tracing.
TODO: Add feature flags and kill switches.
"""

from dotenv import load_dotenv

load_dotenv()  # Load .env BEFORE any app imports that read os.environ

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.rag import router as rag_router
from app.routes.policy import router as policy_router
from app.routes.guardrail import router as guardrail_router
from app.routes.health import router as health_router
from app.routes.profile import router as profile_router

app = FastAPI(
    title="Paeon DMR Backend",
    description="Digital Medical Representative system by Indegene for Cipla. "
                "Compliance-first, B2B-only pharmaceutical intelligence platform.",
    version="0.1.0",
)

# ─── CORS Middleware ─────────────────────────────────────────────────────────
# Allows the Vite dev server (port 3000) and any localhost origin to reach the API.
# In production, replace with explicit allowed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: Add rate limiting middleware
# TODO: Add request ID middleware for tracing

app.include_router(health_router)
app.include_router(rag_router)
app.include_router(policy_router)
app.include_router(guardrail_router)
app.include_router(profile_router)
