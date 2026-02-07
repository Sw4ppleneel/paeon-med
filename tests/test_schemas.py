"""Tests for schema validation on all card types."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# ─── identity_card ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_identity_card_schema(client):
    resp = await client.post("/rag/flashcard", json={"query": "Tell me about Ciplactin"})
    data = resp.json()
    assert data["card_type"] == "identity_card"
    card = data["card"]
    required = ["drug_name", "source_ids"]
    for field in required:
        assert field in card, f"Missing field: {field}"
    assert isinstance(card["source_ids"], list)
    assert len(card["source_ids"]) > 0


# ─── comparison_matrix ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_comparison_matrix_schema(client):
    resp = await client.post(
        "/rag/compare", json={"query": "Compare Ciplactin and Ciplar"}
    )
    data = resp.json()
    assert data["card_type"] == "comparison_matrix"
    card = data["card"]
    assert "drugs" in card
    assert isinstance(card["drugs"], list)
    assert len(card["drugs"]) == 2
    for drug in card["drugs"]:
        assert "drug_name" in drug
        assert "source_ids" in drug


# ─── reimbursement_status_card ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_reimbursement_status_card_schema(client):
    resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    })
    data = resp.json()
    assert data["card_type"] == "reimbursement_status_card"
    card = data["card"]
    required = ["drug_name", "status", "coverage_percent", "approved_amount", "reason_codes"]
    for field in required:
        assert field in card, f"Missing field: {field}"


# ─── policy_report_card ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_policy_report_card_schema(client):
    resp = await client.post("/policy/report/generate", json={
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "patient_age": 55,
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
        "prior_treatments": [],
    })
    data = resp.json()
    assert data["card_type"] == "policy_report_card"
    card = data["card"]
    required = ["trial_eligibility", "reimbursement", "generated_at", "summary"]
    for field in required:
        assert field in card, f"Missing field: {field}"
    # Nested sub-card validation
    assert "drug_name" in card["trial_eligibility"]
    assert "status" in card["trial_eligibility"]
    assert "drug_name" in card["reimbursement"]
    assert "status" in card["reimbursement"]


# ─── refusal_card ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_refusal_card_schema(client):
    resp = await client.post("/guardrail/check", json={
        "text": "I have a headache what should I take"
    })
    data = resp.json()
    assert data["card_type"] == "refusal_card"
    card = data["card"]
    assert "blocked" in card
    assert card["blocked"] is True
    assert "reason" in card
    assert "violation_type" in card
    assert isinstance(card["reason"], str)
    assert len(card["reason"]) > 0


# ─── CardEnvelope structure always present ───────────────────────────────────


@pytest.mark.asyncio
async def test_all_responses_have_card_envelope(client):
    endpoints = [
        ("POST", "/rag/flashcard", {"query": "Tell me about Ciplactin"}),
        ("POST", "/rag/compare", {"query": "Compare Ciplactin and Ciplar"}),
        ("GET", "/rag/intel-feed", None),
        ("POST", "/policy/reimbursement-evaluation", {
            "drug_name": "Ciplar", "diagnosis": "hypertension",
            "insurance_type": "corporate", "claim_amount": 5000.0,
        }),
        ("POST", "/guardrail/check", {"text": "What are indications for Ciplar?"}),
    ]
    for method, path, payload in endpoints:
        if method == "GET":
            resp = await client.get(path)
        else:
            resp = await client.post(path, json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "card_type" in data or "items" in data, f"No envelope for {path}"
