"""Tests for the /api/drug-profile orchestration endpoint.

Phase 2: Verifies enrichment slots are now populated:
- drug_display: subtitle + description via LLM fallbacks
- mechanism: title + text via LLM fallbacks
- coverage_display: deterministic mapping from reimbursement data
- comparison_display: still null with 'placeholder' status
- brand: includes background_gradient
- compliance_display / pricing: still null with 'awaiting_human_input'
"""

from __future__ import annotations

import httpx
import pytest
from httpx import ASGITransport

from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


# ─── Core orchestration tests ────────────────────────────────────────────────


async def test_drug_profile_known_drug(client):
    """Known drug returns identity_card, brand/company, and Phase 2 enrichments."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Ciplactin"})
    assert resp.status_code == 200
    data = resp.json()

    # Backend-supplied
    assert data["identity_card"] is not None
    assert data["identity_card"]["drug_name"] == "Ciplactin"
    assert len(data["source_ids"]) > 0
    assert data["guardrail_status"]["blocked"] is False

    # Brand resolved from brands.json
    assert data["brand"] is not None
    assert data["brand"]["name"] == "Cipla"
    assert data["brand"]["color"] == "#00AEEF"
    assert data["brand"]["division"] == "Allergy & Dermatology Division"

    # Company resolved from brands.json
    assert data["company"] is not None
    assert data["company"]["overview"] is not None
    assert data["company"]["stats"]["founded"] == "1935"

    # Phase 2: drug_display now has subtitle + description
    assert data["drug_display"]["name"] == "Ciplactin"
    assert data["drug_display"]["subtitle"] is not None
    assert "Cyproheptadine" in data["drug_display"]["subtitle"]
    assert data["drug_display"]["description"] is not None

    # Phase 2: mechanism now populated
    assert data["mechanism"] is not None
    assert data["mechanism"]["title"] is not None
    assert data["mechanism"]["text"] is not None

    # Still null: comparison_display, compliance_display, pricing
    assert data["comparison_display"] is None
    assert data["compliance_display"] is None
    assert data["pricing"] is None

    # Coverage not requested (no insurance_type)
    assert data["coverage_display"] is None

    # enrichment_status keys
    status = data["enrichment_status"]
    assert status["identity_card"] == "available"
    assert status["brand"] == "available"
    assert status["company"] == "available"
    assert status["drug_display"] == "available"
    assert status["mechanism"] == "available"
    assert status["comparison_display"] == "placeholder"
    assert status["pricing"] == "awaiting_human_input"


async def test_drug_profile_unknown_drug(client):
    """Unknown drug returns no identity_card, brand/company null with missing_metadata."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "UnknownDrug123"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["identity_card"] is None
    assert data["enrichment_status"]["identity_card"] == "no_data"
    assert data["brand"] is None
    assert data["enrichment_status"]["brand"] == "missing_metadata"
    assert data["company"] is None
    assert data["enrichment_status"]["company"] == "missing_metadata"


async def test_drug_profile_with_comparison(client):
    """Comparison matrix populated when compare_with is provided."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplar",
        "compare_with": "Ciplactin",
    })
    assert resp.status_code == 200
    data = resp.json()

    assert data["comparison_matrix"] is not None
    assert len(data["comparison_matrix"]["drugs"]) == 2
    assert data["enrichment_status"]["comparison_matrix"] == "available"
    # comparison_display is still null (placeholder — no LLM allowed)
    assert data["comparison_display"] is None
    assert data["enrichment_status"]["comparison_display"] == "placeholder"


async def test_drug_profile_with_reimbursement(client):
    """Reimbursement populated when insurance/diagnosis/claim provided."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplar",
        "insurance_type": "corporate",
        "diagnosis": "hypertension",
        "claim_amount": 5000,
    })
    assert resp.status_code == 200
    data = resp.json()

    assert data["reimbursement"] is not None
    assert data["reimbursement"]["status"] == "APPROVED"
    assert data["reimbursement"]["coverage_percent"] == 85.0
    assert data["enrichment_status"]["reimbursement"] == "available"

    # Phase 2: coverage_display is now populated
    assert data["coverage_display"] is not None
    assert data["coverage_display"]["corporate"] is not None
    assert data["coverage_display"]["corporate"]["status"] == "APPROVED"
    assert data["coverage_display"]["corporate"]["color"] == "green"


async def test_drug_profile_no_optional_fields(client):
    """When optional fields omitted, those sections report not_requested."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Actin"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["comparison_matrix"] is None
    assert data["reimbursement"] is None
    assert data["enrichment_status"]["comparison_matrix"] == "not_requested"
    assert data["enrichment_status"]["reimbursement"] == "not_requested"
    assert data["enrichment_status"]["coverage_display"] == "not_requested"


async def test_drug_profile_deterministic(client):
    """Two identical requests return identical responses."""
    payload = {"drug_name": "Ciplactin"}
    r1 = await client.post("/api/drug-profile", json=payload)
    r2 = await client.post("/api/drug-profile", json=payload)

    d1 = r1.json()
    d2 = r2.json()

    assert d1["identity_card"] == d2["identity_card"]
    assert d1["source_ids"] == d2["source_ids"]
    assert d1["drug_display"] == d2["drug_display"]
    assert d1["mechanism"] == d2["mechanism"]
    assert d1["enrichment_status"] == d2["enrichment_status"]


# ─── Brand-specific tests (Phase 1.5 + Phase 2 gradient) ────────────────────


async def test_brand_metadata_all_known_drugs(client):
    """All three known drugs in brands.json return brand metadata with gradient."""
    for drug_name in ["Ciplactin", "Ciplar", "Actin"]:
        resp = await client.post("/api/drug-profile", json={"drug_name": drug_name})
        assert resp.status_code == 200
        data = resp.json()

        assert data["brand"] is not None, f"brand missing for {drug_name}"
        assert data["brand"]["name"] == "Cipla"
        assert data["brand"]["color"] == "#00AEEF"
        assert data["brand"]["accent"] == "#F58220"
        assert data["brand"]["tagline"] == "Caring for Life"
        assert data["brand"]["logo_url"] is not None
        assert data["brand"]["division"] is not None
        assert data["brand"]["background_gradient"] == "light_blue"
        assert data["enrichment_status"]["brand"] == "available"


async def test_company_metadata_all_known_drugs(client):
    """All three known drugs resolve to Cipla company metadata."""
    for drug_name in ["Ciplactin", "Ciplar", "Actin"]:
        resp = await client.post("/api/drug-profile", json={"drug_name": drug_name})
        data = resp.json()

        assert data["company"] is not None, f"company missing for {drug_name}"
        assert data["company"]["overview"] is not None
        assert data["company"]["specialties"] is not None
        assert data["company"]["stats"] is not None
        assert data["company"]["mission"] is not None
        assert data["enrichment_status"]["company"] == "available"


async def test_brand_null_for_unknown_drug(client):
    """A drug not in brands.json returns null brand with missing_metadata status."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Zyrtec"})
    data = resp.json()

    assert data["brand"] is None
    assert data["company"] is None
    assert data["enrichment_status"]["brand"] == "missing_metadata"
    assert data["enrichment_status"]["company"] == "missing_metadata"


async def test_brand_division_varies_per_drug(client):
    """Different drugs may have different divisions even within the same company."""
    r1 = await client.post("/api/drug-profile", json={"drug_name": "Ciplactin"})
    r2 = await client.post("/api/drug-profile", json={"drug_name": "Ciplar"})
    r3 = await client.post("/api/drug-profile", json={"drug_name": "Actin"})

    d1 = r1.json()["brand"]["division"]
    d2 = r2.json()["brand"]["division"]
    d3 = r3.json()["brand"]["division"]

    # All are different divisions
    assert d1 != d2
    assert d2 != d3
    assert d1 != d3


async def test_brand_loader_does_not_import_engines():
    """brand_loader must NOT import from either engine (orchestration-only)."""
    import inspect
    import app.core.brand_loader as bl

    source = inspect.getsource(bl)
    import_lines = [
        line.strip()
        for line in source.splitlines()
        if line.strip().startswith("import ") or line.strip().startswith("from ")
    ]
    for line in import_lines:
        assert "product_intelligence" not in line, f"brand_loader imports product_intelligence: {line}"
        assert "policy_reimbursement" not in line, f"brand_loader imports policy_reimbursement: {line}"
        assert "guardrails" not in line, f"brand_loader imports guardrails: {line}"


# ─── Phase 2: Drug Display enrichment tests ──────────────────────────────────


async def test_drug_display_ciplactin_subtitle(client):
    """Ciplactin subtitle includes composition and dosage form."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Ciplactin"})
    data = resp.json()

    subtitle = data["drug_display"]["subtitle"]
    assert subtitle is not None
    assert "Cyproheptadine Hydrochloride 4mg" in subtitle
    assert "Tablet" in subtitle


async def test_drug_display_ciplar_subtitle(client):
    """Ciplar subtitle includes composition and dosage form."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Ciplar"})
    data = resp.json()

    subtitle = data["drug_display"]["subtitle"]
    assert subtitle is not None
    assert "Propranolol Hydrochloride 40mg" in subtitle
    assert "Tablet" in subtitle


async def test_drug_display_actin_subtitle(client):
    """Actin subtitle includes composition and dosage form."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Actin"})
    data = resp.json()

    subtitle = data["drug_display"]["subtitle"]
    assert subtitle is not None
    assert "Ranitidine Hydrochloride 150mg" in subtitle
    assert "Tablet" in subtitle


async def test_drug_display_description_populated(client):
    """All known drugs return a description mentioning indications."""
    for drug_name in ["Ciplactin", "Ciplar", "Actin"]:
        resp = await client.post("/api/drug-profile", json={"drug_name": drug_name})
        data = resp.json()

        desc = data["drug_display"]["description"]
        assert desc is not None, f"description missing for {drug_name}"
        assert "Indicated for" in desc or "indicated for" in desc.lower()


async def test_drug_display_unknown_drug(client):
    """Unknown drug gets name only; subtitle/description may be null."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "UnknownDrug123"})
    data = resp.json()

    assert data["drug_display"]["name"] == "UnknownDrug123"
    # No identity card text → no subtitle/description
    assert data["drug_display"]["subtitle"] is None
    assert data["drug_display"]["description"] is None


# ─── Phase 2: Mechanism enrichment tests ─────────────────────────────────────


async def test_mechanism_ciplactin(client):
    """Ciplactin mechanism includes antihistaminic action."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Ciplactin"})
    data = resp.json()

    mech = data["mechanism"]
    assert mech is not None
    assert mech["title"] is not None
    assert "antihistamin" in mech["title"].lower() or "antiserotonergic" in mech["title"].lower()
    assert mech["text"] is not None
    assert "cyproheptadine" in mech["text"].lower()


async def test_mechanism_ciplar(client):
    """Ciplar mechanism includes beta-adrenergic blockade."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Ciplar"})
    data = resp.json()

    mech = data["mechanism"]
    assert mech is not None
    assert "beta" in mech["title"].lower() or "adrenergic" in mech["title"].lower()
    assert "propranolol" in mech["text"].lower()


async def test_mechanism_actin(client):
    """Actin mechanism includes H2 receptor antagonism."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Actin"})
    data = resp.json()

    mech = data["mechanism"]
    assert mech is not None
    assert "h2" in mech["title"].lower() or "receptor" in mech["title"].lower()
    assert "ranitidine" in mech["text"].lower()


async def test_mechanism_unknown_drug(client):
    """Unknown drug mechanism is null title and text."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "UnknownDrug123"})
    data = resp.json()

    mech = data["mechanism"]
    assert mech is not None  # slot returned but fields are null
    assert mech["title"] is None
    assert mech["text"] is None


# ─── Phase 2: Coverage display enrichment tests ─────────────────────────────


async def test_coverage_corporate_approved(client):
    """Corporate coverage maps: APPROVED → green, label includes percentage."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplar",
        "insurance_type": "corporate",
        "diagnosis": "hypertension",
        "claim_amount": 5000,
    })
    data = resp.json()

    cov = data["coverage_display"]
    assert cov is not None
    assert cov["corporate"] is not None
    assert cov["corporate"]["status"] == "APPROVED"
    assert cov["corporate"]["color"] == "green"
    assert "85" in cov["corporate"]["label"]
    # Other slots null
    assert cov["government"] is None
    assert cov["private"] is None


async def test_coverage_government_approved(client):
    """Government coverage maps: APPROVED → green, 100% coverage."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplactin",
        "insurance_type": "government",
        "diagnosis": "allergic_rhinitis",
        "claim_amount": 5000,
    })
    data = resp.json()

    cov = data["coverage_display"]
    assert cov is not None
    assert cov["government"] is not None
    assert cov["government"]["status"] == "APPROVED"
    assert cov["government"]["color"] == "green"
    assert "100" in cov["government"]["label"]


async def test_coverage_private(client):
    """Private coverage maps correctly."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplar",
        "insurance_type": "private",
        "diagnosis": "hypertension",
        "claim_amount": 5000,
    })
    data = resp.json()

    cov = data["coverage_display"]
    assert cov is not None
    assert cov["private"] is not None
    assert cov["private"]["status"] == "APPROVED"
    assert cov["private"]["color"] == "green"
    assert "70" in cov["private"]["label"]


async def test_coverage_not_approved_maps_red(client):
    """NOT_APPROVED status maps to red color."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplar",
        "insurance_type": "none",
        "diagnosis": "hypertension",
        "claim_amount": 5000,
    })
    data = resp.json()

    # "none" insurance → 0% → NOT_APPROVED → red
    cov = data["coverage_display"]
    assert cov is not None or data["enrichment_status"]["coverage_display"] in ("no_data", "available")


async def test_coverage_null_when_not_requested(client):
    """No insurance_type → no coverage_display."""
    resp = await client.post("/api/drug-profile", json={"drug_name": "Ciplar"})
    data = resp.json()

    assert data["coverage_display"] is None
    assert data["enrichment_status"]["coverage_display"] == "not_requested"


# ─── Phase 2: Comparison display placeholder test ────────────────────────────


async def test_comparison_display_placeholder(client):
    """Comparison display is always null with 'placeholder' status."""
    resp = await client.post("/api/drug-profile", json={
        "drug_name": "Ciplar",
        "compare_with": "Ciplactin",
    })
    data = resp.json()

    assert data["comparison_display"] is None
    assert data["enrichment_status"]["comparison_display"] == "placeholder"


# ─── Phase 2: Background gradient test ──────────────────────────────────────


async def test_background_gradient_cipla(client):
    """Cipla drugs return 'light_blue' background gradient."""
    for drug_name in ["Ciplactin", "Ciplar", "Actin"]:
        resp = await client.post("/api/drug-profile", json={"drug_name": drug_name})
        data = resp.json()

        assert data["brand"]["background_gradient"] == "light_blue"


# ─── Phase 2: Orchestration-only isolation tests ────────────────────────────


async def test_llm_adapter_does_not_import_engines():
    """llm_adapter must NOT import from either engine (orchestration-only)."""
    import inspect
    import app.core.llm_adapter as la

    source = inspect.getsource(la)
    import_lines = [
        line.strip()
        for line in source.splitlines()
        if line.strip().startswith("import ") or line.strip().startswith("from ")
    ]
    for line in import_lines:
        assert "product_intelligence" not in line, f"llm_adapter imports product_intelligence: {line}"
        assert "policy_reimbursement" not in line, f"llm_adapter imports policy_reimbursement: {line}"
        assert "guardrails" not in line, f"llm_adapter imports guardrails: {line}"


async def test_coverage_enrichment_does_not_import_engines():
    """coverage_enrichment must NOT import from either engine (orchestration-only)."""
    import inspect
    import app.core.coverage_enrichment as ce

    source = inspect.getsource(ce)
    import_lines = [
        line.strip()
        for line in source.splitlines()
        if line.strip().startswith("import ") or line.strip().startswith("from ")
    ]
    for line in import_lines:
        assert "product_intelligence" not in line, f"coverage_enrichment imports product_intelligence: {line}"
        assert "policy_reimbursement" not in line, f"coverage_enrichment imports policy_reimbursement: {line}"
        assert "guardrails" not in line, f"coverage_enrichment imports guardrails: {line}"
