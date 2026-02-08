"""Company Profile route — additive company-first entry point.

POST /api/company-profile

Accepts a company name and returns a structured CompanyOverviewCard.
This is an informational primer ONLY. It does NOT trigger drug intelligence,
policy evaluation, or any existing flow.

The frontend uses the hero_product.drug_name from the response to offer
a transition into the existing drug-first flow via POST /api/drug-profile.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.audit import log_event
from app.core.company_loader import resolve_company_overview
from app.core.schemas import CompanyOverviewCard, CompanyProfileRequest

router = APIRouter(prefix="/api", tags=["Company"])


@router.post("/company-profile", response_model=CompanyOverviewCard)
async def company_profile(req: CompanyProfileRequest):
    """Resolve company metadata and return a CompanyOverviewCard.

    Resolution is deterministic (no LLM). Unknown companies receive
    a card with status='unknown_company'.
    """
    card = resolve_company_overview(req.company_name)

    log_event(
        engine="orchestration",
        endpoint="/api/company-profile",
        input_summary=f"company={req.company_name}",
        output_type="company_overview_card",
        source_ids=[],
    )

    return card
