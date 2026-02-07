"""Health check route.

GET /health
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health():
    return HealthResponse(
        status="healthy",
        engines={
            "product_intelligence": "active",
            "policy_reimbursement": "active",
        },
    ).model_dump()
