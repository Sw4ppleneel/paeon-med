"""Company metadata loader — deterministic resolution from data/companies.json.

This module is part of the ORCHESTRATION layer only.
It does NOT use LLM. Resolution is purely deterministic.
It does NOT modify or interact with the drug-first flow.

Usage:
    from app.core.company_loader import resolve_company_overview

    card = resolve_company_overview("Cipla")    # CompanyOverviewCard
    card = resolve_company_overview("Unknown")  # CompanyOverviewCard with status="unknown_company"
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from app.core.schemas import CompanyOverviewCard, HeroProductSlot

_COMPANIES_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "companies.json"

_companies_data: Dict[str, Any] = {}


def _load_companies() -> Dict[str, Any]:
    """Load company definitions from static JSON. Cached after first call."""
    global _companies_data
    if not _companies_data:
        with open(_COMPANIES_PATH, "r") as f:
            _companies_data = json.load(f)
    return _companies_data


def reload_companies() -> None:
    """Force reload from disk. Used only in tests."""
    global _companies_data
    _companies_data = {}
    _load_companies()


def resolve_company_overview(company_name: str) -> CompanyOverviewCard:
    """Resolve company metadata by name. Deterministic — no LLM.

    Matching is case-insensitive. If the company is not found,
    returns a card with status='unknown_company' and safe defaults.
    """
    data = _load_companies()
    companies = data.get("companies", {})

    # Case-insensitive lookup: normalize input and compare against keys
    normalized = company_name.strip().lower()
    entry = companies.get(normalized)

    # Also try matching against the stored company_name field
    if entry is None:
        for _key, candidate in companies.items():
            if candidate.get("company_name", "").strip().lower() == normalized:
                entry = candidate
                break

    if entry is None:
        return CompanyOverviewCard(
            company_name=company_name,
            logo_url="",
            tagline="",
            company_description="",
            mission_statement="",
            hero_product=HeroProductSlot(drug_name="", rationale=""),
            supported_specialties=[],
            status="unknown_company",
        )

    hero = entry.get("hero_product", {})

    return CompanyOverviewCard(
        company_name=entry["company_name"],
        logo_url=entry.get("logo_url", ""),
        tagline=entry.get("tagline", ""),
        company_description=entry.get("company_description", ""),
        mission_statement=entry.get("mission_statement", ""),
        hero_product=HeroProductSlot(
            drug_name=hero.get("drug_name", ""),
            rationale=hero.get("rationale", ""),
        ),
        supported_specialties=entry.get("supported_specialties", []),
        status="available",
    )
