"""Drug Search route — lightweight, fast drug lookup.

POST /api/drug-search

Returns basic drug data (identity sections, brand, company) WITHOUT
triggering the heavy LLM enrichment chain. This is the endpoint for
the top search bar. After results are displayed, the frontend can
optionally call /api/drug-profile for full enrichment.

Design:
- Spelling correction via LLM (single fast call)
- Document lookup from product_intelligence (deterministic)
- Brand/company from brands.json (deterministic)
- NO drug_display, mechanism, comparison, compliance, coverage enrichment
- Total latency: <500ms for known drugs, <2s with spelling correction
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.audit import log_event
from app.core.brand_loader import resolve_brand, resolve_company
from app.core.llm_adapter import correct_drug_spelling
from app.core.schemas import DrugSearchRequest, DrugSearchResult
from app.engines import product_intelligence as pi_engine

router = APIRouter(prefix="/api", tags=["Drug Search"])


@router.post("/drug-search", response_model=DrugSearchResult)
async def drug_search(req: DrugSearchRequest):
    """Fast drug lookup — no heavy LLM enrichment.

    1. Attempt spelling correction (single LLM call)
    2. Look up document chunks (deterministic)
    3. Resolve brand/company metadata (deterministic)
    4. Return immediately
    """
    drug_name = req.drug_name.strip()
    suggested_name: str | None = None

    # ── 1. Spelling Correction (single fast LLM call) ────────────────────────
    spelling_result = correct_drug_spelling(drug_name)
    if (
        spelling_result
        and spelling_result["is_corrected"]
        and spelling_result["corrected"].strip().lower() != drug_name.strip().lower()
    ):
        suggested_name = spelling_result["corrected"]
        drug_name = suggested_name

    # ── 2. Document Lookup (deterministic) ───────────────────────────────────
    identity_result = pi_engine.flashcard(drug_name)
    sections: list[dict] = []
    source_ids: list[str] = []
    found = False

    if identity_result.card_type == "identity_card":
        card = identity_result.card
        sections = card.get("sections", [])
        source_ids = card.get("source_ids", [])
        found = True

    # ── 3. Brand & Company (deterministic) ───────────────────────────────────
    brand = resolve_brand(drug_name)
    company = resolve_company(drug_name)

    # ── Audit ────────────────────────────────────────────────────────────────
    log_event(
        engine="orchestration",
        endpoint="/api/drug-search",
        input_summary=f"drug={req.drug_name}|resolved={drug_name}|found={found}",
        output_type="drug_search_result",
        source_ids=source_ids,
    )

    return DrugSearchResult(
        drug_name=drug_name,
        found=found,
        sections=sections,
        source_ids=source_ids,
        brand=brand,
        company=company,
        suggested_name=suggested_name,
    )
