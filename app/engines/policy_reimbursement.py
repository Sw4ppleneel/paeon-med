"""Policy & Reimbursement Engine — rule-based, company-defined.

Uses static policies from data/policies.json.
No RAG. No medical claims. ZERO product intelligence logic.
This engine does NOT import from product_intelligence.

TODO: Replace static JSON loading with real policy DB / config service.
TODO: Plug in real Cipla reimbursement calculation engine.
TODO: Add jurisdiction-specific policy rules.
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Dict, List

from app.core.schemas import (
    CardEnvelope,
    PolicyReportCard,
    RefusalCard,
    ReimbursementStatusCard,
    TrialEnablementCard,
)

_POLICY_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "policies.json"

_policies: Dict[str, Any] = {}


def _load_policies() -> Dict[str, Any]:
    """Load policy definitions from static JSON. Cached after first call."""
    global _policies
    if not _policies:
        # TODO: Replace with real policy DB / config service
        with open(_POLICY_PATH, "r") as f:
            _policies = json.load(f)
    return _policies


# ─── Internal: Trial Eligibility (used by report generation) ─────────────────


def _evaluate_trial_eligibility(
    drug_name: str,
    diagnosis: str,
    patient_age: int,
    prior_treatments: List[str],
) -> CardEnvelope:
    """Evaluate trial eligibility based on Cipla-defined policy rules.

    First matching policy determines outcome. No policy stacking.
    If no policy matches → refusal_card.
    """
    policies = _load_policies()
    trial_policies = policies.get("trial_policies", {})

    if drug_name not in trial_policies:
        return CardEnvelope(
            card_type="refusal_card",
            card=RefusalCard(
                reason=f"No trial policy found for '{drug_name}'.",
                violation_type="no_policy",
            ).model_dump(),
        )

    policy = trial_policies[drug_name]
    reason_codes: List[str] = []
    exclusion_flags: List[str] = []

    # Age check
    if patient_age < policy["min_age"]:
        reason_codes.append(f"AGE_BELOW_MIN:{policy['min_age']}")
    if patient_age > policy["max_age"]:
        reason_codes.append(f"AGE_ABOVE_MAX:{policy['max_age']}")

    # Diagnosis check
    if diagnosis not in policy["eligible_diagnoses"]:
        reason_codes.append(f"DIAGNOSIS_NOT_ELIGIBLE:{diagnosis}")

    # Prior treatments check
    required_prior = set(policy.get("required_prior_treatments", []))
    provided_prior = set(prior_treatments)
    missing_prior = required_prior - provided_prior
    if missing_prior:
        reason_codes.append(f"MISSING_PRIOR_TREATMENT:{','.join(sorted(missing_prior))}")

    # Exclusion criteria
    for excl in policy.get("exclusion_criteria", []):
        if excl.lower() in diagnosis.lower() or excl.lower() in [
            p.lower() for p in prior_treatments
        ]:
            exclusion_flags.append(excl)
            reason_codes.append(f"EXCLUSION_CRITERIA:{excl}")

    # Determine status
    if reason_codes:
        status = "NOT_APPROVED"
    else:
        status = "APPROVED"

    card = TrialEnablementCard(
        drug_name=drug_name,
        status=status,
        reason_codes=reason_codes,
        required_documents=policy["required_documents"],
        exclusion_flags=exclusion_flags,
    )
    return CardEnvelope(card_type="trial_enablement_card", card=card.model_dump())


# ─── Public API: Reimbursement Evaluation ────────────────────────────────────


def evaluate_reimbursement(
    drug_name: str,
    diagnosis: str,
    insurance_type: str,
    claim_amount: float,
) -> CardEnvelope:
    """Evaluate reimbursement eligibility based on Cipla-defined policy rules.

    First matching policy determines outcome. No policy stacking.
    If no policy matches → refusal_card.
    """
    policies = _load_policies()
    reimb_policies = policies.get("reimbursement_policies", {})

    if drug_name not in reimb_policies:
        return CardEnvelope(
            card_type="refusal_card",
            card=RefusalCard(
                reason=f"No reimbursement policy found for '{drug_name}'.",
                violation_type="no_policy",
            ).model_dump(),
        )

    policy = reimb_policies[drug_name]
    reason_codes: List[str] = []

    # Diagnosis check
    if diagnosis not in policy["eligible_diagnoses"]:
        reason_codes.append(f"DIAGNOSIS_NOT_COVERED:{diagnosis}")

    # Insurance type
    coverage_info = policy["insurance_coverage"].get(insurance_type)
    if not coverage_info:
        reason_codes.append(f"INSURANCE_TYPE_UNKNOWN:{insurance_type}")
        coverage_percent = 0.0
        max_amount = 0.0
    else:
        coverage_percent = coverage_info["coverage_percent"]
        max_amount = coverage_info["max_amount"]

    # Calculate approved amount
    covered_amount = claim_amount * (coverage_percent / 100.0)
    approved_amount = min(covered_amount, max_amount)

    if coverage_percent == 0:
        reason_codes.append("NO_COVERAGE")

    if claim_amount > max_amount and max_amount > 0:
        reason_codes.append(f"CLAIM_EXCEEDS_MAX:{max_amount}")

    # Determine status
    if coverage_percent == 0 or any("DIAGNOSIS_NOT_COVERED" in rc for rc in reason_codes):
        status = "NOT_APPROVED"
    elif reason_codes:
        status = "CONDITIONAL"
    else:
        status = "APPROVED"

    card = ReimbursementStatusCard(
        drug_name=drug_name,
        status=status,
        coverage_percent=coverage_percent,
        approved_amount=approved_amount,
        reason_codes=reason_codes,
    )
    return CardEnvelope(card_type="reimbursement_status_card", card=card.model_dump())


# ─── Public API: Report Generation ──────────────────────────────────────────


def generate_report(
    drug_name: str,
    diagnosis: str,
    patient_age: int,
    insurance_type: str,
    claim_amount: float,
    prior_treatments: List[str],
) -> CardEnvelope:
    """Generate a combined policy report (trial + reimbursement).

    If no policies found for the drug → refusal_card.
    """
    policies = _load_policies()
    if (
        drug_name not in policies.get("trial_policies", {})
        and drug_name not in policies.get("reimbursement_policies", {})
    ):
        return CardEnvelope(
            card_type="refusal_card",
            card=RefusalCard(
                reason=f"No policies found for '{drug_name}'.",
                violation_type="no_policy",
            ).model_dump(),
        )

    trial_result = _evaluate_trial_eligibility(
        drug_name, diagnosis, patient_age, prior_treatments
    )
    reimb_result = evaluate_reimbursement(
        drug_name, diagnosis, insurance_type, claim_amount
    )

    trial_card = trial_result.card
    reimb_card = reimb_result.card

    summary_parts = [
        f"Drug: {drug_name}",
        f"Trial eligibility: {trial_card.get('status', 'N/A')}",
        f"Reimbursement: {reimb_card.get('status', 'N/A')}",
    ]

    report = PolicyReportCard(
        trial_eligibility=TrialEnablementCard(**trial_card),
        reimbursement=ReimbursementStatusCard(**reimb_card),
        generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        summary=" | ".join(summary_parts),
    )
    return CardEnvelope(card_type="policy_report_card", card=report.model_dump())
