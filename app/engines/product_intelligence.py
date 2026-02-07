"""Product Intelligence Engine — deterministic, RAG-simulated.

Uses static document chunks from data/documents.json.
Every fact is grounded with source_ids. No retrieval → refusal_card.

This engine has ZERO policy or reimbursement logic.
It does NOT import from policy_reimbursement.

TODO: Replace static JSON loading with real vector DB / document store.
TODO: Plug in embedding model for semantic retrieval.
TODO: Plug in LLM provider for answer generation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from app.core.schemas import (
    CardEnvelope,
    ComparisonDrugEntry,
    ComparisonMatrix,
    IdentityCard,
    IntelFeedItem,
    RefusalCard,
)
from app.core.query_understanding import extract_drug_names

_DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "documents.json"

_chunks: List[Dict[str, Any]] = []


def _load_chunks() -> List[Dict[str, Any]]:
    """Load document chunks from static JSON. Cached after first call."""
    global _chunks
    if not _chunks:
        # TODO: Replace with real vector DB / document store
        with open(_DATA_PATH, "r") as f:
            _chunks = json.load(f)
    return _chunks


def _get_chunks_for_drug(drug_name: str) -> List[Dict[str, Any]]:
    """Retrieve ALL matching chunks for a drug. Deterministic, keyword-based."""
    chunks = _load_chunks()
    return [c for c in chunks if c["drug_name"].lower() == drug_name.lower()]


# ─── Public API ──────────────────────────────────────────────────────────────


def flashcard(query: str) -> CardEnvelope:
    """Return an identity_card for the first recognized drug, or refusal_card.

    If zero chunks retrieved → refusal_card.
    """
    drugs = extract_drug_names(query)
    if not drugs:
        return CardEnvelope(
            card_type="refusal_card",
            card=RefusalCard(
                reason="No recognized drug found in query.",
                violation_type="no_data",
            ).model_dump(),
        )

    drug_name = drugs[0]
    matching = _get_chunks_for_drug(drug_name)
    if not matching:
        return CardEnvelope(
            card_type="refusal_card",
            card=RefusalCard(
                reason=f"No approved documents found for '{drug_name}'.",
                violation_type="no_data",
            ).model_dump(),
        )

    source_ids = [c["source_id"] for c in matching]
    sections = [
        {"section": c["section"], "text": c["text"]}
        for c in matching
    ]

    card = IdentityCard(
        drug_name=drug_name,
        sections=sections,
        source_ids=source_ids,
    )
    return CardEnvelope(card_type="identity_card", card=card.model_dump())


def compare(query: str) -> CardEnvelope:
    """Return a comparison_matrix for recognized drugs, or refusal_card.

    Requires at least two recognized drugs. If any drug has zero chunks → refusal_card.
    """
    drugs = extract_drug_names(query)
    if len(drugs) < 2:
        return CardEnvelope(
            card_type="refusal_card",
            card=RefusalCard(
                reason="Need at least two recognized drugs to compare.",
                violation_type="insufficient_data",
            ).model_dump(),
        )

    entries: List[ComparisonDrugEntry] = []
    for drug_name in drugs[:2]:
        matching = _get_chunks_for_drug(drug_name)
        if not matching:
            return CardEnvelope(
                card_type="refusal_card",
                card=RefusalCard(
                    reason=f"No approved documents found for '{drug_name}'.",
                    violation_type="no_data",
                ).model_dump(),
            )
        source_ids = [c["source_id"] for c in matching]
        sections = [
            {"section": c["section"], "text": c["text"]}
            for c in matching
        ]
        entries.append(
            ComparisonDrugEntry(
                drug_name=drug_name,
                sections=sections,
                source_ids=source_ids,
            )
        )

    matrix = ComparisonMatrix(drugs=entries)
    return CardEnvelope(card_type="comparison_matrix", card=matrix.model_dump())


def intel_feed() -> Dict[str, Any]:
    """Return all document headlines as intel feed items.

    Ordering is deterministic and fixed (file order).
    """
    chunks = _load_chunks()
    seen: set = set()
    items: List[Dict[str, Any]] = []
    for c in chunks:
        key = c["source_id"]
        if key not in seen:
            seen.add(key)
            # Derive headline from first line of text
            headline = c["text"].split(".")[0] + "."
            items.append(
                IntelFeedItem(
                    drug_name=c["drug_name"],
                    headline=headline,
                    source_id=c["source_id"],
                ).model_dump()
            )
    return {"items": items}


def get_source_ids_for_drug(drug_name: str) -> List[str]:
    """Helper to get source_ids for audit logging."""
    matching = _get_chunks_for_drug(drug_name)
    return [c["source_id"] for c in matching]
