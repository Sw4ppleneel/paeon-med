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
from app.routes.company import router as company_router
from app.routes.drug_search import router as drug_search_router
from app.routes.ask import router as ask_router

app = FastAPI(
    title="Paeon DMR Backend",
    description="Digital Medical Representative system by Indegene for Cipla. "
                "Compliance-first, B2B-only pharmaceutical intelligence platform.",
    version="0.1.0",
)

# ─── CORS Middleware ─────────────────────────────────────────────────────────
# Allows the Vite dev server (port 3000) and Vercel frontend origins.
# Set FRONTEND_URL env var on your backend Vercel project to your FE URL.
import os

_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Add production frontend URL(s) from env
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    _cors_origins.extend([u.strip() for u in _frontend_url.split(",") if u.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
app.include_router(company_router)
app.include_router(drug_search_router)
app.include_router(ask_router)
