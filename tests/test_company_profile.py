"""Tests for company-profile endpoint and company loader.

Validates:
- Known companies return correct structured data
- Unknown companies return status='unknown_company'
- Case-insensitive resolution
- No side effects on existing drug-first flow
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.company_loader import resolve_company_overview, reload_companies

client = TestClient(app)


# ─── Unit: company_loader ────────────────────────────────────────────────────


class TestCompanyLoader:
    """Direct unit tests for resolve_company_overview."""

    def setup_method(self):
        reload_companies()

    def test_cipla_resolved(self):
        card = resolve_company_overview("Cipla")
        assert card.status == "available"
        assert card.company_name == "Cipla"
        assert card.tagline == "Caring for Life"
        assert card.hero_product.drug_name == "Levosalbutamol"
        assert "Pulmonology" in card.supported_specialties

    def test_pfizer_resolved(self):
        card = resolve_company_overview("Pfizer")
        assert card.status == "available"
        assert card.company_name == "Pfizer"
        assert card.hero_product.drug_name == "Atorvastatin"
        assert "Cardiology" in card.supported_specialties

    def test_jnj_resolved(self):
        card = resolve_company_overview("Johnson & Johnson")
        assert card.status == "available"
        assert card.company_name == "Johnson & Johnson"
        assert card.hero_product.drug_name == "Rivaroxaban"

    def test_case_insensitive(self):
        card = resolve_company_overview("CIPLA")
        assert card.status == "available"
        assert card.company_name == "Cipla"

    def test_case_insensitive_mixed(self):
        card = resolve_company_overview("pFiZeR")
        assert card.status == "available"
        assert card.company_name == "Pfizer"

    def test_unknown_company(self):
        card = resolve_company_overview("Nonexistent Pharma Corp")
        assert card.status == "unknown_company"
        assert card.company_name == "Nonexistent Pharma Corp"
        assert card.hero_product.drug_name == ""
        assert card.supported_specialties == []

    def test_whitespace_handling(self):
        card = resolve_company_overview("  Cipla  ")
        assert card.status == "available"
        assert card.company_name == "Cipla"


# ─── Integration: POST /api/company-profile ──────────────────────────────────


class TestCompanyProfileEndpoint:
    """Integration tests hitting the actual endpoint."""

    def test_cipla_endpoint(self):
        resp = client.post("/api/company-profile", json={"company_name": "Cipla"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "available"
        assert data["company_name"] == "Cipla"
        assert data["hero_product"]["drug_name"] == "Levosalbutamol"
        assert data["logo_url"] == "cipla.png"

    def test_pfizer_endpoint(self):
        resp = client.post("/api/company-profile", json={"company_name": "Pfizer"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "available"
        assert data["hero_product"]["drug_name"] == "Atorvastatin"

    def test_jnj_endpoint(self):
        resp = client.post("/api/company-profile", json={"company_name": "Johnson & Johnson"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "available"
        assert data["hero_product"]["drug_name"] == "Rivaroxaban"

    def test_unknown_endpoint(self):
        resp = client.post("/api/company-profile", json={"company_name": "FakePharma"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "unknown_company"

    def test_missing_body(self):
        resp = client.post("/api/company-profile", json={})
        assert resp.status_code == 422  # Validation error

    def test_drug_profile_unaffected(self):
        """Ensure existing drug-profile endpoint still works."""
        resp = client.post("/api/drug-profile", json={"drug_name": "Ciplactin"})
        assert resp.status_code == 200
        data = resp.json()
        assert "identity_card" in data
        assert "enrichment_status" in data
