"""Tests for RAG / Product Intelligence engine and routes."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# ─── Health ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "engines" in data
    assert "product_intelligence" in data["engines"]
    assert "policy_reimbursement" in data["engines"]


# ─── Flashcard ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_flashcard_known_drug(client):
    resp = await client.post("/rag/flashcard", json={"query": "Tell me about Ciplactin"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "identity_card"
    card = data["card"]
    assert card["drug_name"] == "Ciplactin"
    assert "source_ids" in card
    assert len(card["source_ids"]) > 0
    # Must contain grounded text from documents
    assert "text" in card or "sections" in card


@pytest.mark.asyncio
async def test_flashcard_unknown_drug(client):
    resp = await client.post("/rag/flashcard", json={"query": "Tell me about XYZDrug999"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"
    assert data["card"]["blocked"] is True
    assert "reason" in data["card"]


@pytest.mark.asyncio
async def test_flashcard_deterministic(client):
    payload = {"query": "Tell me about Ciplactin"}
    resp1 = await client.post("/rag/flashcard", json=payload)
    resp2 = await client.post("/rag/flashcard", json=payload)
    assert resp1.json() == resp2.json()


# ─── Compare ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_compare_known_drugs(client):
    resp = await client.post(
        "/rag/compare", json={"query": "Compare Ciplactin and Ciplar"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "comparison_matrix"
    assert "drugs" in data["card"]
    assert len(data["card"]["drugs"]) == 2
    drug_names = [d["drug_name"] for d in data["card"]["drugs"]]
    assert "Ciplactin" in drug_names
    assert "Ciplar" in drug_names
    for drug in data["card"]["drugs"]:
        assert "source_ids" in drug
        assert len(drug["source_ids"]) > 0


@pytest.mark.asyncio
async def test_compare_one_unknown(client):
    resp = await client.post(
        "/rag/compare", json={"query": "Compare Ciplactin and UnknownDrug"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["card_type"] == "refusal_card"


@pytest.mark.asyncio
async def test_compare_deterministic(client):
    payload = {"query": "Compare Ciplactin and Ciplar"}
    resp1 = await client.post("/rag/compare", json=payload)
    resp2 = await client.post("/rag/compare", json=payload)
    assert resp1.json() == resp2.json()


# ─── Intel Feed ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_intel_feed(client):
    resp = await client.get("/rag/intel-feed")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert len(data["items"]) > 0
    for item in data["items"]:
        assert "drug_name" in item
        assert "headline" in item
        assert "source_id" in item


@pytest.mark.asyncio
async def test_intel_feed_deterministic(client):
    resp1 = await client.get("/rag/intel-feed")
    resp2 = await client.get("/rag/intel-feed")
    assert resp1.json() == resp2.json()
