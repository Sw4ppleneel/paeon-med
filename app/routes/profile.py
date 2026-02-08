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
from app.core.llm_adapter import (
    enrich_drug_display,
    enrich_mechanism_summary,
    enrich_comparison_display,
    enrich_compliance_display,
    infer_company_name,
    correct_drug_spelling,
)
from app.core.query_understanding import extract_drug_names
from app.core.schemas import (
    BrandMetadataSlot,
    CompanyMetadataSlot,
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

    # ── 0. Spelling Correction ───────────────────────────────────────────────
    suggested_name: str | None = None
    spelling_result = correct_drug_spelling(req.drug_name)
    if (
        spelling_result
        and spelling_result["is_corrected"]
        and spelling_result["corrected"].strip().lower() != req.drug_name.strip().lower()
    ):
        suggested_name = spelling_result["corrected"]
        # Use the corrected name for all downstream processing
        req.drug_name = suggested_name
        enrichment_status["spelling_correction"] = "corrected"
    else:
        enrichment_status["spelling_correction"] = "ok"

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
    company = resolve_company(req.drug_name)

    # If brand is unknown, ask Gemini to infer the manufacturer + brand color
    if brand is None:
        inferred = infer_company_name(req.drug_name)
        if inferred:
            brand = BrandMetadataSlot(
                name=inferred["company_name"],
                color=inferred["color"],
                accent=inferred["accent"],
                tagline=None,
                logo_url=None,
                division=None,
                background_gradient=None,
            )
            company = CompanyMetadataSlot(
                overview=f"{inferred['company_name']} — manufacturer of {req.drug_name}.",
                specialties=None,
                stats=None,
                mission=None,
            )
            enrichment_status["brand"] = "inferred_by_llm"
            enrichment_status["company"] = "inferred_by_llm"
        else:
            enrichment_status["brand"] = "missing_metadata"
            enrichment_status["company"] = "missing_metadata"
    else:
        enrichment_status["brand"] = "available"
        enrichment_status["company"] = "available" if company else "missing_metadata"

    # ── 8. Coverage Display — deterministic mapping ──────────────────────────
    coverage_display = enrich_coverage_display(reimbursement, req.insurance_type)
    if coverage_display is not None:
        enrichment_status["coverage_display"] = "available"
    elif req.insurance_type is None:
        enrichment_status["coverage_display"] = "not_requested"
    else:
        enrichment_status["coverage_display"] = "no_data"

    # ── 9. Comparison Display — LLM enrichment ────────────────────────────────
    comparison_display = enrich_comparison_display(req.drug_name, sections_text)
    if comparison_display is not None:
        enrichment_status["comparison_display"] = "available"
    else:
        enrichment_status["comparison_display"] = "no_data"

    # ── 10. Compliance Display — LLM enrichment ─────────────────────────────
    compliance_display = enrich_compliance_display(req.drug_name, sections_text)
    if compliance_display is not None:
        enrichment_status["compliance_display"] = "available"
    else:
        enrichment_status["compliance_display"] = "no_data"

    # ── 11. Pricing — placeholder ────────────────────────────────────────────
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
        comparison_display=comparison_display,
        coverage_display=coverage_display,
        compliance_display=compliance_display,
        pricing=None,
        enrichment_status=enrichment_status,
        suggested_name=suggested_name,
    )
