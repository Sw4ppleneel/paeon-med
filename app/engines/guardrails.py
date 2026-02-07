"""Compliance guardrail engine — detect patient-directed and off-label queries.

Returns refusal_card if blocked, clearance card otherwise.
Never exposes internal reasoning, regex patterns, or stack traces.

TODO: Add jurisdiction-specific guardrail rules.
TODO: Add configurable kill switches for compliance categories.
"""

from __future__ import annotations

import re
from typing import List

from app.core.schemas import CardEnvelope, ClearanceCard, RefusalCard

# ─── Patient-directed patterns ───────────────────────────────────────────────

_PATIENT_PATTERNS: List[re.Pattern] = [
    re.compile(r"\b(i have|i am feeling|i feel|my .*(pain|ache|sick|hurt))\b", re.IGNORECASE),
    re.compile(r"\b(what should i take|can i take|should i take)\b", re.IGNORECASE),
    re.compile(r"\b(help me|advise me|suggest.*for me)\b", re.IGNORECASE),
    re.compile(r"\b(my mother|my father|my child|my wife|my husband)\b", re.IGNORECASE),
    re.compile(r"\b(can my|should my|dose for my)\b", re.IGNORECASE),
    re.compile(r"\b(feeling very sick|feeling unwell)\b", re.IGNORECASE),
    re.compile(r"\b(what medicine|which medicine|give me medicine)\b", re.IGNORECASE),
    re.compile(r"\bwhat should .* take\b", re.IGNORECASE),
    re.compile(r"\bcan .* take \d+\s*mg\b", re.IGNORECASE),
]

# ─── Off-label patterns ─────────────────────────────────────────────────────

_OFF_LABEL_PATTERNS: List[re.Pattern] = [
    re.compile(r"\b(cure|cures)\s+(cancer|hiv|aids|covid|diabetes)\b", re.IGNORECASE),
    re.compile(r"\boff[- ]?label\b", re.IGNORECASE),
    re.compile(r"\bunapproved\s+use\b", re.IGNORECASE),
]


def check_compliance(text: str) -> CardEnvelope:
    """Check text for patient-directed advice or off-label claims.

    Returns refusal_card if blocked, clearance card otherwise.
    Business rule violations return HTTP 200 with refusal_card (not 4xx/5xx).
    """
    # Check off-label first (more specific)
    for pattern in _OFF_LABEL_PATTERNS:
        if pattern.search(text):
            return CardEnvelope(
                card_type="refusal_card",
                card=RefusalCard(
                    blocked=True,
                    reason="Query contains off-label or unapproved claims. "
                           "This system only provides information on approved indications.",
                    violation_type="off_label",
                ).model_dump(),
            )

    # Check patient-directed
    for pattern in _PATIENT_PATTERNS:
        if pattern.search(text):
            return CardEnvelope(
                card_type="refusal_card",
                card=RefusalCard(
                    blocked=True,
                    reason="This is a B2B system for healthcare professionals. "
                           "Patient-directed medical advice is not supported.",
                    violation_type="patient_directed",
                ).model_dump(),
            )

    # Passed all checks
    return CardEnvelope(
        card_type="clearance",
        card=ClearanceCard(
            blocked=False,
            reason="Query passed compliance check.",
        ).model_dump(),
    )
