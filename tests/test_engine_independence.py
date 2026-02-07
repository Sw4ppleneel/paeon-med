"""Tests for engine independence — no cross-imports, no shared state leakage."""

import inspect
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# ─── RAG engine has no policy fields ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_rag_does_not_return_policy_fields(client):
    resp = await client.post("/rag/flashcard", json={"query": "Tell me about Ciplactin"})
    assert resp.status_code == 200
    data = resp.json()
    card = data["card"]
    assert "coverage_percent" not in card
    assert "reimbursement" not in card
    assert "trial_eligibility" not in card
    assert "approved_amount" not in card


# ─── Policy engine has no RAG fields ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_policy_does_not_return_rag_fields(client):
    resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplactin",
        "diagnosis": "allergic_rhinitis",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    card = data["card"]
    assert "text" not in card
    assert "section" not in card
    assert "headline" not in card


# ─── Both engines callable in same session without interference ──────────────


@pytest.mark.asyncio
async def test_both_engines_callable(client):
    rag_resp = await client.post("/rag/flashcard", json={"query": "Tell me about Ciplar"})
    policy_resp = await client.post("/policy/reimbursement-evaluation", json={
        "drug_name": "Ciplar",
        "diagnosis": "hypertension",
        "insurance_type": "corporate",
        "claim_amount": 5000.0,
    })
    assert rag_resp.status_code == 200
    assert policy_resp.status_code == 200
    assert rag_resp.json()["card_type"] == "identity_card"
    assert policy_resp.json()["card_type"] == "reimbursement_status_card"


# ─── Source code: no cross-imports between engines ───────────────────────────


def test_product_intelligence_has_no_policy_imports():
    """Verify product_intelligence.py does not import from policy_reimbursement."""
    from app.engines import product_intelligence
    source = inspect.getsource(product_intelligence)
    # Extract only import lines
    import_lines = [
        line.strip() for line in source.splitlines()
        if line.strip().startswith("import ") or line.strip().startswith("from ")
    ]
    import_block = "\n".join(import_lines)
    assert "policy_reimbursement" not in import_block
    assert "policies.json" not in import_block


def test_policy_reimbursement_has_no_rag_imports():
    """Verify policy_reimbursement.py does not import from product_intelligence."""
    from app.engines import policy_reimbursement
    source = inspect.getsource(policy_reimbursement)
    # Extract only import lines
    import_lines = [
        line.strip() for line in source.splitlines()
        if line.strip().startswith("import ") or line.strip().startswith("from ")
    ]
    import_block = "\n".join(import_lines)
    assert "product_intelligence" not in import_block
    assert "documents.json" not in import_block
