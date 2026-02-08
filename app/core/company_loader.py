"""Company metadata loader — deterministic resolution from data/companies.json,
with LLM fallback for unknown companies.

This module is part of the ORCHESTRATION layer.
Primary resolution is deterministic from the static JSON.
If a company is not found, Gemini is used to infer company data.

Usage:
    from app.core.company_loader import resolve_company_overview

    card = resolve_company_overview("Cipla")    # CompanyOverviewCard (from JSON)
    card = resolve_company_overview("GSK")      # CompanyOverviewCard (from Gemini)
    card = resolve_company_overview("xyzfake")  # CompanyOverviewCard with status="unknown_company"
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

from app.core.schemas import CompanyOverviewCard, HeroProductSlot

log = logging.getLogger(__name__)

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
    """Resolve company metadata by name.

    1. Try deterministic lookup from companies.json (case-insensitive).
    2. If not found, ask Gemini to infer the company data.
    3. If Gemini also can't identify it, return unknown_company status.
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

    if entry is not None:
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

    # ── Gemini fallback for unknown companies ────────────────────────────────
    log.info("Company '%s' not in JSON — trying Gemini inference…", company_name)
    try:
        from app.core.llm_adapter import infer_company_overview

        inferred = infer_company_overview(company_name)
        if inferred:
            hero = inferred.get("hero_product", {})
            log.info("Gemini resolved '%s' as '%s'", company_name, inferred["company_name"])
            return CompanyOverviewCard(
                company_name=inferred["company_name"],
                logo_url="",  # No logo for Gemini-inferred companies
                tagline=inferred.get("tagline", ""),
                company_description=inferred.get("company_description", ""),
                mission_statement=inferred.get("mission_statement", ""),
                hero_product=HeroProductSlot(
                    drug_name=hero.get("drug_name", ""),
                    rationale=hero.get("rationale", ""),
                ),
                supported_specialties=inferred.get("supported_specialties", []),
                status="available",
            )
    except Exception as exc:
        log.warning("Gemini company inference failed for '%s': %s", company_name, exc)

    # ── Unknown company ──────────────────────────────────────────────────────
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
