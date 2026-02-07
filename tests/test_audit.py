"""Tests for audit logging."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from app.core.audit import get_audit_log


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture(autouse=True)
def clear_audit_log():
    """Clear audit log before each test to prevent cross-test contamination."""
    get_audit_log().clear()
    yield


# ─── RAG audit ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_records_rag_call(client):
    await client.post("/rag/flashcard", json={"query": "Tell me about Ciplactin"})
    log = get_audit_log()
    assert len(log) >= 1
    entry = log[-1]
    assert entry["engine"] == "product_intelligence"
    assert entry["endpoint"] == "/rag/flashcard"
    assert "timestamp" in entry
    assert "input_summary" in entry
    assert "output_type" in entry


@pytest.mark.asyncio
async def test_audit_log_includes_source_ids_for_rag(client):
    await client.post("/rag/flashcard", json={"query": "Tell me about Ciplactin"})
    log = get_audit_log()
    entry = log[-1]
    assert "source_ids" in entry
    assert isinstance(entry["source_ids"], list)
    assert len(entry["source_ids"]) > 0


# ─── Policy audit ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_records_policy_call(client):
    await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplactin",
        "diagnosis": "allergic_rhinitis",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    })
    log = get_audit_log()
    assert len(log) >= 1
    entry = log[-1]
    assert entry["engine"] == "policy_reimbursement"
    assert entry["endpoint"] == "/policy/reimbursement-evaluation"
    assert "timestamp" in entry


# ─── Guardrail audit ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_records_guardrail_call(client):
    await client.post("/guardrail/check", json={
        "text": "I have a headache what should I take"
    })
    log = get_audit_log()
    assert len(log) >= 1
    entry = log[-1]
    assert entry["engine"] == "guardrail"
    assert entry["endpoint"] == "/guardrail/check"


# ─── Audit does not affect response ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_does_not_affect_response(client):
    resp = await client.post("/rag/flashcard", json={"query": "Tell me about Ciplar"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "identity_card"
    # Audit log entry exists but response is unaffected
    log = get_audit_log()
    assert len(log) >= 1


# ─── Audit log entry has fixed keys ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_entry_has_fixed_keys(client):
    await client.post("/rag/flashcard", json={"query": "Tell me about Ciplactin"})
    log = get_audit_log()
    entry = log[-1]
    expected_keys = {"timestamp", "engine", "endpoint", "input_summary", "output_type", "source_ids"}
    assert set(entry.keys()) == expected_keys
