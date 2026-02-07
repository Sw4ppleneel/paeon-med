"""Drug Profile orchestration route.

POST /api/drug-profile

Packages data from both engines into a unified DrugProfileResponse.
Phase 2: enrichment slots for drug_display, mechanism, and coverage_display
are now populated via LLM adapter (with rule-based fallbacks) and deterministic
coverage mapping. Comparison display remains a placeholder. Compliance and
pricing remain awaiting_human_input.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.audit import log_event
from app.core.brand_loader import resolve_brand, resolve_company
from app.core.coverage_enrichment import enrich_coverage_display
from app.core.llm_adapter import enrich_drug_display, enrich_mechanism_summary
from app.core.query_understanding import extract_drug_names
from app.core.schemas import (
    DrugProfileRequest,
    DrugProfileResponse,
)
from app.engines import product_intelligence as pi_engine
from app.engines import guardrails as guardrail_engine

router = APIRouter(prefix="/api", tags=["Orchestration"])


def _collect_sections_text(identity_card: dict | None) -> str:
    """Join all section texts from an identity card for enrichment input."""
    if identity_card is None:
        return ""
    sections = identity_card.get("sections", [])
    return " ".join(s.get("text", "") for s in sections if isinstance(s, dict))


@router.post("/drug-profile", response_model=DrugProfileResponse)
async def drug_profile(req: DrugProfileRequest):
    """Orchestrate a unified drug profile from both engines.

    Backend-supplied fields are populated from existing engines.
    Phase 2: drug_display, mechanism, and coverage_display are enriched.
    """
    enrichment_status: dict[str, str] = {}

    # ── 1. Product Intelligence: Identity Card ───────────────────────────────
    identity_result = pi_engine.flashcard(req.drug_name)
    identity_card = None
    source_ids: list[str] = []

    if identity_result.card_type == "identity_card":
        identity_card = identity_result.card
        source_ids = identity_card.get("source_ids", [])
        enrichment_status["identity_card"] = "available"
    else:
        enrichment_status["identity_card"] = "no_data"

    # ── 2. Product Intelligence: Comparison Matrix ───────────────────────────
    comparison_matrix = None
    if req.compare_with:
        compare_query = f"{req.drug_name} vs {req.compare_with}"
        compare_result = pi_engine.compare(compare_query)
        if compare_result.card_type == "comparison_matrix":
            comparison_matrix = compare_result.card
            enrichment_status["comparison_matrix"] = "available"
        else:
            enrichment_status["comparison_matrix"] = "no_data"
    else:
        enrichment_status["comparison_matrix"] = "not_requested"

    # ── 3. Policy & Reimbursement ────────────────────────────────────────────
    reimbursement = None
    if req.insurance_type and req.diagnosis and req.claim_amount is not None:
        from app.engines import policy_reimbursement as pr_engine

        reimb_result = pr_engine.evaluate_reimbursement(
            drug_name=req.drug_name,
            diagnosis=req.diagnosis,
            insurance_type=req.insurance_type,
            claim_amount=req.claim_amount,
        )
        if reimb_result.card_type == "reimbursement_status_card":
            reimbursement = reimb_result.card
            enrichment_status["reimbursement"] = "available"
        else:
            reimbursement = reimb_result.card
            enrichment_status["reimbursement"] = "no_policy"
    else:
        enrichment_status["reimbursement"] = "not_requested"

    # ── 4. Guardrail Check ───────────────────────────────────────────────────
    guardrail_result = guardrail_engine.check_compliance(req.drug_name)
    guardrail_status = guardrail_result.card
    enrichment_status["guardrail_status"] = "available"

    # ── 5. Drug Display — LLM/fallback enrichment ────────────────────────────
    sections_text = _collect_sections_text(identity_card)
    drug_display = enrich_drug_display(req.drug_name, sections_text)
    if drug_display.subtitle is not None:
        enrichment_status["drug_display"] = "available"
    else:
        enrichment_status["drug_display"] = "partial_name_only"

    # ── 6. Mechanism of Action — LLM/fallback enrichment ─────────────────────
    mechanism = enrich_mechanism_summary(req.drug_name, sections_text)
    if mechanism.title is not None and mechanism.text is not None:
        enrichment_status["mechanism"] = "available"
    elif mechanism.title is not None or mechanism.text is not None:
        enrichment_status["mechanism"] = "partial"
    else:
        enrichment_status["mechanism"] = "no_data"

    # ── 7. Brand & Company metadata from brands.json ─────────────────────────
    brand = resolve_brand(req.drug_name)
    if brand is not None:
        enrichment_status["brand"] = "available"
    else:
        enrichment_status["brand"] = "missing_metadata"

    company = resolve_company(req.drug_name)
    if company is not None:
        enrichment_status["company"] = "available"
    else:
        enrichment_status["company"] = "missing_metadata"

    # ── 8. Coverage Display — deterministic mapping ──────────────────────────
    coverage_display = enrich_coverage_display(reimbursement, req.insurance_type)
    if coverage_display is not None:
        enrichment_status["coverage_display"] = "available"
    elif req.insurance_type is None:
        enrichment_status["coverage_display"] = "not_requested"
    else:
        enrichment_status["coverage_display"] = "no_data"

    # ── 9. Comparison Display — placeholder (LOCKED: no LLM) ────────────────
    enrichment_status["comparison_display"] = "placeholder"

    # ── 10. Remaining enrichment slots — explicitly null ─────────────────────
    enrichment_status["compliance_display"] = "awaiting_human_input"
    enrichment_status["pricing"] = "awaiting_human_input"

    # ── Audit ────────────────────────────────────────────────────────────────
    log_event(
        engine="orchestration",
        endpoint="/api/drug-profile",
        input_summary=f"{req.drug_name}|compare={req.compare_with}|ins={req.insurance_type}",
        output_type="drug_profile",
        source_ids=source_ids,
    )

    return DrugProfileResponse(
        identity_card=identity_card,
        comparison_matrix=comparison_matrix,
        reimbursement=reimbursement,
        guardrail_status=guardrail_status,
        source_ids=source_ids,
        drug_display=drug_display,
        brand=brand,
        company=company,
        mechanism=mechanism,
        comparison_display=None,
        coverage_display=coverage_display,
        compliance_display=None,
        pricing=None,
        enrichment_status=enrichment_status,
    )
