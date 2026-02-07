"""Coverage display enrichment — deterministic mapping from policy engine output.

Maps backend reimbursement results to frontend-ready coverage display slots.
Uses LOCKED mapping rules:
  - government → Ayushman Bharat
  - corporate → CGHS
  - private → Private Insurance
  - APPROVED → green
  - CONDITIONAL → yellow
  - NOT_APPROVED → red

This module is part of the ORCHESTRATION layer only.
It does NOT import from either engine.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.core.schemas import CoverageDisplaySlot, CoverageSchemeSlot

# ─── Locked mapping rules ────────────────────────────────────────────────────

_STATUS_COLOR_MAP: Dict[str, str] = {
    "APPROVED": "green",
    "CONDITIONAL": "yellow",
    "NOT_APPROVED": "red",
}

_INSURANCE_SCHEME_MAP: Dict[str, str] = {
    "government": "Ayushman Bharat",
    "corporate": "CGHS",
    "private": "Private Insurance",
}


def enrich_coverage_display(
    reimbursement_card: Optional[Dict[str, Any]],
    insurance_type: Optional[str],
) -> Optional[CoverageDisplaySlot]:
    """Build a CoverageDisplaySlot from a reimbursement_status_card.

    Returns None if no reimbursement data is available.
    Maps insurance_type to the correct scheme slot (government, corporate, private).
    """
    if reimbursement_card is None or insurance_type is None:
        return None

    status = reimbursement_card.get("status", "NOT_APPROVED")
    color = _STATUS_COLOR_MAP.get(status, "red")
    coverage_pct = reimbursement_card.get("coverage_percent", 0)
    scheme_name = _INSURANCE_SCHEME_MAP.get(insurance_type)

    if scheme_name is None:
        return None

    label = f"{coverage_pct:.0f}% Coverage"

    scheme = CoverageSchemeSlot(
        status=status,
        color=color,
        label=label,
    )

    # Place into the correct slot based on insurance_type
    slot = CoverageDisplaySlot()
    if insurance_type == "government":
        slot.government = scheme
    elif insurance_type == "corporate":
        slot.corporate = scheme
    elif insurance_type == "private":
        slot.private = scheme

    return slot
