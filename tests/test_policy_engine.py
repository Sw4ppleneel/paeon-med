"""Tests for Policy & Reimbursement engine and routes."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# ─── Reimbursement Evaluation ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_reimbursement_approved(client):
    resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "reimbursement_status_card"
    card = data["card"]
    assert card["status"] in ("APPROVED", "CONDITIONAL", "NOT_APPROVED")
    assert "coverage_percent" in card
    assert "approved_amount" in card
    assert "reason_codes" in card


@pytest.mark.asyncio
async def test_reimbursement_not_approved_no_insurance(client):
    resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "insurance_type": "none",
        "claim_amount": 100000.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "reimbursement_status_card"
    assert data["card"]["status"] == "NOT_APPROVED"
    assert data["card"]["coverage_percent"] == 0


@pytest.mark.asyncio
async def test_reimbursement_not_approved_diagnosis(client):
    resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplar",
        "diagnosis": "unrelated_condition",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "reimbursement_status_card"
    assert data["card"]["status"] == "NOT_APPROVED"


@pytest.mark.asyncio
async def test_reimbursement_unknown_drug(client):
    resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "UnknownDrug",
        "diagnosis": "xyz",
        "insurance_type": "corporate",
        "claim_amount": 1000.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"


@pytest.mark.asyncio
async def test_reimbursement_deterministic(client):
    payload = {
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    }
    resp1 = await client.post("/policy/reimbursement-evaluation", json=payload)
    resp2 = await client.post("/policy/reimbursement-evaluation", json=payload)
    assert resp1.json() == resp2.json()


# ─── Report Generation ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_report_generation(client):
    resp = await client.post("/policy/report/generate", json={
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "patient_age": 55,
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
        "prior_treatments": [],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "policy_report_card"
    card = data["card"]
    assert "trial_eligibility" in card
    assert "reimbursement" in card
    assert "generated_at" in card
    assert "summary" in card
    # Trial sub-card
    assert card["trial_eligibility"]["drug_name"] == "Ciplar"
    assert card["trial_eligibility"]["status"] in ("APPROVED", "CONDITIONAL", "NOT_APPROVED")
    # Reimbursement sub-card
    assert card["reimbursement"]["drug_name"] == "Ciplar"
    assert card["reimbursement"]["status"] in ("APPROVED", "CONDITIONAL", "NOT_APPROVED")


@pytest.mark.asyncio
async def test_report_unknown_drug(client):
    resp = await client.post("/policy/report/generate", json={
        "drug_name": "FakeDrug",
        "diagnosis": "xyz",
        "patient_age": 30,
        "insurance_type": "corporate",
        "claim_amount": 1000.0,
        "prior_treatments": [],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"


@pytest.mark.asyncio
async def test_report_deterministic(client):
    payload = {
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "patient_age": 55,
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
        "prior_treatments": [],
    }
    resp1 = await client.post("/policy/report/generate", json=payload)
    resp2 = await client.post("/policy/report/generate", json=payload)
    d1 = resp1.json()
    d2 = resp2.json()
    # generated_at may differ by microseconds; compare card_type and structure
    assert d1["card_type"] == d2["card_type"]
    assert d1["card"]["trial_eligibility"] == d2["card"]["trial_eligibility"]
    assert d1["card"]["reimbursement"] == d2["card"]["reimbursement"]
