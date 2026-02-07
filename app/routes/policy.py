"""Policy & Reimbursement routes.

POST /policy/reimbursement-evaluation
POST /policy/report/generate
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.audit import log_event
from app.core.schemas import (
    ReimbursementRequest,
    ReportGenerateRequest,
)
from app.engines import policy_reimbursement as pr_engine

router = APIRouter(prefix="/policy", tags=["Policy & Reimbursement"])


@router.post("/reimbursement-evaluation")
async def reimbursement_evaluation(req: ReimbursementRequest):
    result = pr_engine.evaluate_reimbursement(
        drug_name=req.drug_name,
        diagnosis=req.diagnosis,
        insurance_type=req.insurance_type,
        claim_amount=req.claim_amount,
    )

    log_event(
        engine="policy_reimbursement",
        endpoint="/policy/reimbursement-evaluation",
        input_summary=f"{req.drug_name}|{req.diagnosis}|{req.insurance_type}|{req.claim_amount}",
        output_type=result.card_type,
    )
    return result.model_dump()


@router.post("/report/generate")
async def report_generate(req: ReportGenerateRequest):
    result = pr_engine.generate_report(
        drug_name=req.drug_name,
        diagnosis=req.diagnosis,
        patient_age=req.patient_age,
        insurance_type=req.insurance_type,
        claim_amount=req.claim_amount,
        prior_treatments=req.prior_treatments,
    )

    log_event(
        engine="policy_reimbursement",
        endpoint="/policy/report/generate",
        input_summary=f"{req.drug_name}|{req.diagnosis}|age={req.patient_age}",
        output_type=result.card_type,
    )
    return result.model_dump()
