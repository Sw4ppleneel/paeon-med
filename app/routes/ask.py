"""Ask route — general LLM Q&A for the "Talk More" section.

POST /api/ask

Accepts a free-text question (optionally scoped to a drug context)
and returns an LLM-generated answer. This is separate from drug-profile
enrichment — it handles conversational follow-up questions.

Design:
- Single LLM call with pharma-specific system prompt
- Guardrail check on input (blocks non-medical queries)
- Drug context is optional (enhances answer relevance)
- Does NOT modify any existing flow
"""

from __future__ import annotations

import logging
import os
import re
from fastapi import APIRouter, Request, Header, HTTPException

from app.core.audit import log_event
from app.core.schemas import AskRequest, AskResponse
from app.engines import guardrails as guardrail_engine

router = APIRouter(prefix="/api", tags=["Ask"])

log = logging.getLogger(__name__)

# ─── System prompt for pharma Q&A ───────────────────────────────────────────

_ASK_SYSTEM_PROMPT = (
    "You are a pharmaceutical intelligence assistant for medical representatives. "
    "You provide accurate, evidence-based answers about medications, drug interactions, "
    "dosing guidelines, mechanism of action, clinical trials, and therapeutic areas.\n\n"
    "Rules:\n"
    "- Be factual and clinically accurate\n"
    "- Cite drug classes, therapeutic categories, and known guidelines where relevant\n"
    "- Do NOT provide patient-specific medical advice\n"
    "- Do NOT recommend off-label use without disclaimer\n"
    "- If you don't know something, say so clearly\n"
    "- Keep answers concise but comprehensive (2-4 paragraphs max)\n"
    "- Use professional medical terminology appropriate for MRs\n"
    "- If a drug context is provided, focus answers around that drug when relevant"
)


def _call_ask_llm(question: str, drug_context: str | None) -> str | None:
    """Call Gemini for a general pharma Q&A response."""
    # Import here to avoid circular imports and keep the module lightweight
    from app.core.llm_adapter import _call_llm

    user_prompt = question
    if drug_context:
        user_prompt = f"[Current drug context: {drug_context}]\n\nQuestion: {question}"

    return _call_llm(_ASK_SYSTEM_PROMPT, user_prompt, max_tokens=1024)


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest, request: Request, x_api_key: str | None = Header(None)):
    """Answer a general pharmaceutical question via LLM.

    Optionally scoped to a drug context for more relevant answers.
    Input is checked against guardrails before processing.
    """
    # Basic auth guard: if ADMIN_API_KEY is set, require it via X-API-KEY header
    admin_key = os.getenv("ADMIN_API_KEY")
    if admin_key:
        if not x_api_key or x_api_key != admin_key:
            raise HTTPException(status_code=401, detail="Unauthorized")

    question = req.question.strip()

    # Reject overly long queries
    if len(question) > 2000:
        return AskResponse(
            question=question,
            answer="Query too long.",
            drug_context=req.drug_context,
            status="refused",
        )

    # Simple PII/PCI guard: block SSNs and credit-card like sequences
    pii_patterns = [
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN
        re.compile(r"\b(?:\d[ -]*?){13,16}\b"),  # Credit card-ish
    ]
    for pat in pii_patterns:
        if pat.search(question):
            log_event(
                engine="orchestration",
                endpoint="/api/ask",
                input_summary=f"q={question[:80]}|pii_block",
                output_type="ask_refused",
                source_ids=[],
            )
            return AskResponse(
                question=question,
                answer="Query contains sensitive information and was blocked.",
                drug_context=req.drug_context,
                status="refused",
            )

    # ── 1. Guardrail check ───────────────────────────────────────────────────
    guardrail_result = guardrail_engine.check_compliance(question)
    if guardrail_result.card.get("blocked", False):
        log_event(
            engine="orchestration",
            endpoint="/api/ask",
            input_summary=f"q={question[:80]}|blocked",
            output_type="ask_refused",
            source_ids=[],
        )
        return AskResponse(
            question=question,
            answer=guardrail_result.card.get("reason", "Query blocked by compliance check."),
            drug_context=req.drug_context,
            status="refused",
        )

    # ── 2. LLM call ─────────────────────────────────────────────────────────
    answer = _call_ask_llm(question, req.drug_context)

    if answer is None:
        log_event(
            engine="orchestration",
            endpoint="/api/ask",
            input_summary=f"q={question[:80]}|error",
            output_type="ask_error",
            source_ids=[],
        )
        return AskResponse(
            question=question,
            answer="I'm unable to process your question right now. Please try again.",
            drug_context=req.drug_context,
            status="error",
        )

    # ── Audit ────────────────────────────────────────────────────────────────
    log_event(
        engine="orchestration",
        endpoint="/api/ask",
        input_summary=f"q={question[:80]}|ctx={req.drug_context}",
        output_type="ask_answered",
        source_ids=[],
    )

    return AskResponse(
        question=question,
        answer=answer,
        drug_context=req.drug_context,
        status="answered",
    )
