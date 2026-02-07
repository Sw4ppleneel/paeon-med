"""Simple rule-based query understanding — extract drug names, intent, and constraints.

This module does NOT contain business logic. It is used only for:
- Extracting entities (drug names)
- Detecting intent
- Detecting population constraints
- Validating input before routing
"""

from __future__ import annotations

import re
from typing import List

# Known drug names (lowercase → canonical). Sorted by length descending at match time
# to prevent substring collisions (e.g. "actin" inside "ciplactin").
KNOWN_DRUGS = {
    "ciplactin": "Ciplactin",
    "ciplar": "Ciplar",
    "actin": "Actin",
}


def extract_drug_names(text: str) -> List[str]:
    """Return canonical drug names found in query text using word-boundary matching.

    Names are matched longest-first to prevent "actin" matching inside "ciplactin".
    """
    text_lower = text.lower()
    found: List[str] = []
    for key, canonical in sorted(KNOWN_DRUGS.items(), key=lambda x: len(x[0]), reverse=True):
        if re.search(rf"\b{re.escape(key)}\b", text_lower):
            if canonical not in found:
                found.append(canonical)
    return found


def detect_intent(text: str) -> str:
    """Simple keyword-based intent detection.

    Returns one of: 'flashcard', 'compare', 'reimbursement', 'report', 'unknown'
    """
    text_lower = text.lower()

    if any(w in text_lower for w in ["compare", "vs", "versus", "difference"]):
        return "compare"
    if any(w in text_lower for w in ["reimburse", "coverage", "claim", "insurance"]):
        return "reimbursement"
    if any(w in text_lower for w in ["report", "generate report", "clearance"]):
        return "report"

    return "flashcard"


def detect_population_constraints(text: str) -> List[str]:
    """Detect population-specific constraints in query text.

    Supports code-switched / Hinglish input patterns.
    """
    text_lower = text.lower()
    constraints: List[str] = []
    if any(w in text_lower for w in ["renal", "kidney", "nephro", "gurdey"]):
        constraints.append("renal_impairment")
    if any(w in text_lower for w in ["elderly", "geriatric", "older", "buzurg"]):
        constraints.append("elderly")
    if any(w in text_lower for w in ["pregnan", "maternal", "gestati", "garbhvati"]):
        constraints.append("pregnancy")
    if any(w in text_lower for w in ["pediatric", "paediatric", "child", "infant", "bachche"]):
        constraints.append("pediatric")
    return constraints
