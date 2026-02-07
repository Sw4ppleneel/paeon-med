"""RAG / Product Intelligence routes.

POST /rag/flashcard
POST /rag/compare
GET  /rag/intel-feed
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.audit import log_event
from app.core.query_understanding import extract_drug_names
from app.core.schemas import RAGQueryRequest
from app.engines import product_intelligence as pi_engine

router = APIRouter(prefix="/rag", tags=["Product Intelligence"])


@router.post("/flashcard")
async def flashcard(req: RAGQueryRequest):
    result = pi_engine.flashcard(req.query)

    drugs = extract_drug_names(req.query)
    source_ids: list[str] = []
    for d in drugs:
        source_ids.extend(pi_engine.get_source_ids_for_drug(d))

    log_event(
        engine="product_intelligence",
        endpoint="/rag/flashcard",
        input_summary=req.query[:120],
        output_type=result.card_type,
        source_ids=source_ids,
    )
    return result.model_dump()


@router.post("/compare")
async def compare(req: RAGQueryRequest):
    result = pi_engine.compare(req.query)

    drugs = extract_drug_names(req.query)
    source_ids: list[str] = []
    for d in drugs:
        source_ids.extend(pi_engine.get_source_ids_for_drug(d))

    log_event(
        engine="product_intelligence",
        endpoint="/rag/compare",
        input_summary=req.query[:120],
        output_type=result.card_type,
        source_ids=source_ids,
    )
    return result.model_dump()


@router.get("/intel-feed")
async def intel_feed():
    result = pi_engine.intel_feed()

    log_event(
        engine="product_intelligence",
        endpoint="/rag/intel-feed",
        input_summary="intel-feed-request",
        output_type="intel_feed",
    )
    return result
