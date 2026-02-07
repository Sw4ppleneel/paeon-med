"""Guardrail routes.

POST /guardrail/check
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.audit import log_event
from app.core.schemas import GuardrailRequest
from app.engines import guardrails as guardrail_engine

router = APIRouter(prefix="/guardrail", tags=["Guardrails"])


@router.post("/check")
async def guardrail_check(req: GuardrailRequest):
    result = guardrail_engine.check_compliance(req.text)

    log_event(
        engine="guardrail",
        endpoint="/guardrail/check",
        input_summary=req.text[:120],
        output_type=result.card_type,
    )
    return result.model_dump()
