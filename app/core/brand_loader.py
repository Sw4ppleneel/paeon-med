"""Brand metadata loader — reads drug → company → brand mapping from data/brands.json.

This module is part of the ORCHESTRATION layer only.
It does NOT belong to either engine.
It does NOT generate or assume any values — all data must be human-configured in brands.json.

Usage:
    from app.core.brand_loader import resolve_brand, resolve_company

    brand = resolve_brand("Ciplactin")     # BrandMetadataSlot | None
    company = resolve_company("Ciplactin") # CompanyMetadataSlot | None
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.schemas import BrandMetadataSlot, CompanyMetadataSlot

_BRANDS_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "brands.json"

_brands_data: Dict[str, Any] = {}


def _load_brands() -> Dict[str, Any]:
    """Load brand definitions from static JSON. Cached after first call."""
    global _brands_data
    if not _brands_data:
        with open(_BRANDS_PATH, "r") as f:
            _brands_data = json.load(f)
    return _brands_data


def reload_brands() -> None:
    """Force reload from disk. Used only in tests."""
    global _brands_data
    _brands_data = {}
    _load_brands()


def resolve_brand(drug_name: str) -> Optional[BrandMetadataSlot]:
    """Resolve brand metadata for a drug_name from brands.json.

    Returns BrandMetadataSlot if mapping exists, None otherwise.
    Does NOT invent defaults for missing drugs.
    """
    data = _load_brands()
    drugs = data.get("drugs", {})

    drug_entry = drugs.get(drug_name)
    if not drug_entry:
        return None

    brand_block = drug_entry.get("brand")
    if not brand_block:
        return None

    # Resolve company name from company_key
    company_key = drug_entry.get("company_key", "")
    companies = data.get("companies", {})
    company_info = companies.get(company_key, {})
    company_name = company_info.get("name")

    return BrandMetadataSlot(
        name=company_name,
        color=brand_block.get("color"),
        accent=brand_block.get("accent"),
        tagline=brand_block.get("tagline"),
        logo_url=brand_block.get("logo_url"),
        division=brand_block.get("division"),
        background_gradient=company_info.get("background_gradient"),
    )


def resolve_company(drug_name: str) -> Optional[CompanyMetadataSlot]:
    """Resolve company metadata for a drug_name from brands.json.

    Returns CompanyMetadataSlot if mapping exists, None otherwise.
    Does NOT invent defaults for missing drugs.
    """
    data = _load_brands()
    drugs = data.get("drugs", {})

    drug_entry = drugs.get(drug_name)
    if not drug_entry:
        return None

    company_key = drug_entry.get("company_key", "")
    companies = data.get("companies", {})
    company_info = companies.get(company_key)
    if not company_info:
        return None

    return CompanyMetadataSlot(
        overview=company_info.get("overview"),
        specialties=company_info.get("specialties"),
        stats=company_info.get("stats"),
        mission=company_info.get("mission"),
    )
