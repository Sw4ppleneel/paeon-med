"""Tests for compliance guardrails."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# ─── Patient-directed query blocking ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_guardrail_blocks_patient_query(client):
    resp = await client.post("/guardrail/check", json={
        "text": "I have a headache, what should I take?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"
    assert data["card"]["blocked"] is True
    assert data["card"]["violation_type"] == "patient_directed"


@pytest.mark.asyncio
async def test_guardrail_blocks_dosage_advice(client):
    resp = await client.post("/guardrail/check", json={
        "text": "Can my mother take 500mg of this medicine?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"
    assert data["card"]["blocked"] is True


@pytest.mark.asyncio
async def test_guardrail_blocks_off_label(client):
    resp = await client.post("/guardrail/check", json={
        "text": "Can Ciplactin cure cancer?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"
    assert data["card"]["blocked"] is True
    assert data["card"]["violation_type"] == "off_label"


@pytest.mark.asyncio
async def test_guardrail_passes_valid_hcp_query(client):
    resp = await client.post("/guardrail/check", json={
        "text": "What are the approved indications for Ciplactin?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "clearance"
    assert data["card"]["blocked"] is False


@pytest.mark.asyncio
async def test_guardrail_passes_policy_query(client):
    resp = await client.post("/guardrail/check", json={
        "text": "Is Ciplar eligible for reimbursement under corporate insurance?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "clearance"
    assert data["card"]["blocked"] is False


# ─── Guardrail never exposes internal reasoning ──────────────────────────────


@pytest.mark.asyncio
async def test_guardrail_no_internal_reasoning(client):
    resp = await client.post("/guardrail/check", json={
        "text": "I am feeling very sick, help me please"
    })
    assert resp.status_code == 200
    data = resp.json()
    card = data["card"]
    assert "reason" in card
    # Must not leak regex patterns, internal logic, stack traces
    assert "pattern" not in card.get("reason", "").lower()
    assert "regex" not in card.get("reason", "").lower()
    assert "traceback" not in card.get("reason", "").lower()
