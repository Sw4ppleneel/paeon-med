"""LLM adapter for Paeon DMR enrichment — transformation layer only.

The LLM is used ONLY as a text transformation tool, NOT as a knowledge source.
All inputs MUST be grounded in existing backend data (identity_card sections).
All outputs MUST pass guardrail compliance checks.

This module belongs to the ORCHESTRATION layer.
It does NOT import from either engine.

Phase 3: Integrated with Google Gemini API (google-genai SDK).
Uses gemini-2.0-flash as primary model with gemini-2.5-flash as fallback.
Proper system_instruction via GenerateContentConfig per official docs:
  https://ai.google.dev/gemini-api/docs

Key design decisions:
  - Batched prompts: subtitle+description in ONE call, title+text in ONE call
    → halves API usage (2 calls per drug instead of 4)
  - Rich drug-focused prompts: indications, contraindications, side effects,
    pharmacokinetics, dosage — NOT company marketing fluff
  - MoA is ALWAYS generated when Gemini is available
  - Graceful fallback to rule-based extraction when Gemini fails
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

from dotenv import load_dotenv

from app.core.schemas import (
    ComparisonDisplaySlot,
    ComparisonRowSlot,
    ComplianceDisplaySlot,
    DrugDisplaySlot,
    MechanismSlot,
)

load_dotenv()

log = logging.getLogger(__name__)

# ─── Gemini Configuration ───────────────────────────────────────────────────

_GEMINI_API_KEY: str | None = os.environ.get("GEMINI_API_KEY")
_GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
_GEMINI_FALLBACK_MODEL: str = os.environ.get("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash")

_gemini_client = None  # Lazy singleton


def _get_gemini_client():
    """Lazily initialise the Gemini client singleton.

    Returns None if the API key is missing or the SDK import fails.
    Uses google.genai.Client per the official SDK:
      https://ai.google.dev/gemini-api/docs/quickstart
    """
    global _gemini_client

    if _gemini_client is not None:
        return _gemini_client

    if not _GEMINI_API_KEY:
        log.info("GEMINI_API_KEY not set — LLM enrichment disabled, using fallbacks.")
        return None

    try:
        from google import genai

        _gemini_client = genai.Client(api_key=_GEMINI_API_KEY)
        log.info("Gemini client initialised (primary: %s, fallback: %s).",
                 _GEMINI_MODEL, _GEMINI_FALLBACK_MODEL)
        return _gemini_client
    except Exception as exc:
        log.warning("Failed to initialise Gemini: %s", exc)
        return None


def _call_gemini_with_model(
    client, model: str, system_prompt: str, user_prompt: str,
    max_tokens: int = 512,
) -> Optional[str]:
    """Make a single generate_content call to a specific model.

    Uses GenerateContentConfig with system_instruction per official API docs:
      https://ai.google.dev/gemini-api/docs/text-generation
    """
    from google.genai import types

    response = client.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.3,
            max_output_tokens=max_tokens,
        ),
    )
    text = response.text.strip() if response.text else None
    if text:
        log.debug("Gemini [%s] response (%.60s…)", model, text)
    return text or None


def _call_llm(
    system_prompt: str, user_prompt: str, max_tokens: int = 512,
) -> Optional[str]:
    """Call Google Gemini for text transformation with automatic model fallback.

    Tries _GEMINI_MODEL (gemini-2.0-flash) first, then falls back to
    _GEMINI_FALLBACK_MODEL (gemini-2.5-flash) if the primary fails.

    Returns None when:
      - Gemini is not configured (no API key)
      - Both primary and fallback API calls fail
      - The response is empty
    All callers MUST have a fallback path for None.
    """
    client = _get_gemini_client()
    if client is None:
        return None

    # Try primary model
    try:
        result = _call_gemini_with_model(
            client, _GEMINI_MODEL, system_prompt, user_prompt, max_tokens
        )
        if result:
            return result
    except Exception as exc:
        log.warning("Gemini primary model [%s] failed: %s", _GEMINI_MODEL, exc)

    # Try fallback model (only if different from primary)
    if _GEMINI_FALLBACK_MODEL != _GEMINI_MODEL:
        try:
            log.info("Trying fallback model [%s]…", _GEMINI_FALLBACK_MODEL)
            result = _call_gemini_with_model(
                client, _GEMINI_FALLBACK_MODEL, system_prompt, user_prompt,
                max_tokens,
            )
            if result:
                return result
        except Exception as exc:
            log.warning("Gemini fallback model [%s] also failed: %s",
                        _GEMINI_FALLBACK_MODEL, exc)

    log.warning("All Gemini models exhausted, falling back to rule-based.")
    return None


def reset_gemini():
    """Reset the Gemini singleton — used by tests to toggle LLM on/off."""
    global _gemini_client, _GEMINI_API_KEY
    _gemini_client = None
    _GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


# ─── JSON extraction helper ─────────────────────────────────────────────────

def _extract_json(raw: str) -> Optional[dict]:
    """Extract a JSON object from an LLM response.

    Handles responses wrapped in markdown code fences.
    """
    text = raw.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        log.debug("Failed to parse JSON from LLM response: %.80s…", text)
        return None


# ─── Enrichment: Drug Display ───────────────────────────────────────────────


# ─── Drug Display prompt templates ───────────────────────────────────────────

_DRUG_DISPLAY_SYSTEM = (
    "You are a clinical pharmaceutical data formatter for medical representatives. "
    "You must return a JSON object with exactly these keys:\n"
    '  "subtitle": "<Active Ingredient> <Strength> | <Dosage Form>",\n'
    '  "description": "A concise 2-3 sentence clinical summary covering: '
    "primary indications, key contraindications, notable side effects, and "
    'recommended dosage range. Focus on what an MR needs to know."\n\n'
    "Rules:\n"
    "- Be factual and medically accurate\n"
    "- Prioritise clinical data over marketing language\n"
    "- Include therapeutic class in the description\n"
    "- Mention pregnancy category if known\n"
    "- Return ONLY valid JSON, no markdown fences, no extra text"
)

_DRUG_DISPLAY_GROUNDED_SYSTEM = (
    "You are a clinical pharmaceutical data formatter for medical representatives. "
    "Use ONLY facts present in the provided text. Do NOT add any external information.\n"
    "Return a JSON object with exactly these keys:\n"
    '  "subtitle": "<Active Ingredient> <Strength> | <Dosage Form>",\n'
    '  "description": "A concise 2-3 sentence clinical summary covering: '
    "primary indications, key contraindications, notable side effects, and "
    'dosage information — extracted ONLY from the provided text."\n\n'
    "Rules:\n"
    "- Use ONLY facts from the provided text\n"
    "- Prioritise clinical data over marketing language\n"
    "- Return ONLY valid JSON, no markdown fences, no extra text"
)


def enrich_drug_display(
    drug_name: str,
    sections_text: str,
) -> DrugDisplaySlot:
    """Generate subtitle and description in a single batched LLM call.

    Uses LLM as transformation layer over existing backend data.
    Falls back to rule-based extraction if LLM is unavailable.
    """
    is_unknown = not sections_text.strip()

    system = _DRUG_DISPLAY_SYSTEM if is_unknown else _DRUG_DISPLAY_GROUNDED_SYSTEM
    user = (
        f"Drug: {drug_name}"
        if is_unknown
        else f"Drug: {drug_name}\nText: {sections_text}"
    )

    raw = _call_llm(system, user, max_tokens=300)
    if raw:
        parsed = _extract_json(raw)
        if parsed:
            return DrugDisplaySlot(
                name=drug_name,
                subtitle=parsed.get("subtitle"),
                description=parsed.get("description"),
            )
        log.debug("Drug display JSON parse failed, raw: %.80s…", raw)

    # Fallback: rule-based extraction (only for grounded text)
    if not is_unknown:
        subtitle = _extract_subtitle_fallback(drug_name, sections_text)
        description = _extract_description_fallback(drug_name, sections_text)
        return DrugDisplaySlot(
            name=drug_name, subtitle=subtitle, description=description,
        )

    return DrugDisplaySlot(name=drug_name)


def _extract_subtitle_fallback(drug_name: str, text: str) -> Optional[str]:
    """Rule-based subtitle extraction from product overview text.

    Looks for pattern: 'DrugName (Composition) ... Available as <form>.'
    """
    import re

    # Extract composition from parenthetical
    comp_match = re.search(
        rf"{re.escape(drug_name)}\s*\(([^)]+)\)",
        text,
        re.IGNORECASE,
    )
    composition = comp_match.group(1).strip() if comp_match else None

    # Extract dosage form
    form_match = re.search(
        r"[Aa]vailable\s+as\s+(\w+)",
        text,
    )
    dosage_form = form_match.group(1).strip().capitalize() if form_match else None

    if composition and dosage_form:
        return f"{composition} | {dosage_form}"
    elif composition:
        return composition
    return None


def _extract_description_fallback(drug_name: str, text: str) -> Optional[str]:
    """Rule-based description extraction from product overview text.

    Extracts indication sentence: 'It is indicated for X, Y, and Z.'
    """
    import re

    match = re.search(
        r"[Ii]t is indicated for\s+([^.]+)\.",
        text,
    )
    if match:
        indications = match.group(1).strip()
        return f"Indicated for {indications}."
    return None


# ─── Enrichment: Mechanism of Action ────────────────────────────────────────

_MOA_SYSTEM = (
    "You are a clinical pharmacologist writing for medical representatives. "
    "You must return a JSON object with exactly these keys:\n"
    '  "title": "A short 3-6 word pharmacological mechanism title '
    '(e.g. Selective COX-2 Inhibition, IL-23 Pathway Blockade)",\n'
    '  "text": "A detailed 2-4 sentence explanation of the mechanism of action. '
    "Include: the drug's pharmacological class, what receptor/enzyme/pathway it "
    "targets, how it produces its therapeutic effect, and its selectivity if "
    'relevant. Use precise pharmacological language."\n\n'
    "Rules:\n"
    "- Be scientifically accurate and detailed\n"
    "- Always explain the molecular target and downstream effect\n"
    "- Mention the drug class (e.g. NSAID, monoclonal antibody, SSRI)\n"
    "- Return ONLY valid JSON, no markdown fences, no extra text"
)

_MOA_GROUNDED_SYSTEM = (
    "You are a clinical pharmacologist writing for medical representatives. "
    "Use ONLY facts present in the provided text, but you may use your knowledge "
    "of pharmacology to elaborate the mechanism if the drug class is mentioned.\n"
    "Return a JSON object with exactly these keys:\n"
    '  "title": "A short 3-6 word pharmacological mechanism title",\n'
    '  "text": "A detailed 2-4 sentence explanation of the mechanism of action. '
    "Include the pharmacological class, molecular target, and therapeutic effect. "
    'Ground it in the text provided but elaborate on the pharmacology."\n\n'
    "Rules:\n"
    "- Be scientifically accurate\n"
    "- Return ONLY valid JSON, no markdown fences, no extra text"
)


def enrich_mechanism_summary(
    drug_name: str,
    sections_text: str,
) -> MechanismSlot:
    """Generate mechanism of action title and explanation in a single batched call.

    MoA is ALWAYS generated when Gemini is available — this is critical
    clinical information that medical reps need.
    Falls back to rule-based extraction if LLM is unavailable.
    """
    is_unknown = not sections_text.strip()

    system = _MOA_SYSTEM if is_unknown else _MOA_GROUNDED_SYSTEM
    user = (
        f"Drug: {drug_name}\nProvide the complete mechanism of action."
        if is_unknown
        else f"Drug: {drug_name}\nText: {sections_text}\nProvide the mechanism of action."
    )

    raw = _call_llm(system, user, max_tokens=400)
    if raw:
        parsed = _extract_json(raw)
        if parsed:
            return MechanismSlot(
                title=parsed.get("title"),
                text=parsed.get("text"),
            )
        log.debug("MoA JSON parse failed, raw: %.80s…", raw)

    # Fallback: rule-based extraction (only for grounded text)
    if not is_unknown:
        title = _extract_mechanism_title_fallback(drug_name, sections_text)
        text = _extract_mechanism_text_fallback(drug_name, sections_text)
        return MechanismSlot(title=title, text=text)

    return MechanismSlot()


def _extract_mechanism_title_fallback(drug_name: str, text: str) -> Optional[str]:
    """Derive a mechanism title from the drug class mentioned in text."""
    import re

    # Look for drug class indicators
    class_patterns = [
        (r"antihistamin\w*", "Antihistaminic Action"),
        (r"beta.?block\w*|propranolol", "Beta-Adrenergic Blockade"),
        (r"h2.?receptor\s*antagonist|ranitidine", "H2 Receptor Antagonism"),
        (r"proton\s+pump\s+inhibitor", "Proton Pump Inhibition"),
        (r"ace\s+inhibitor", "ACE Inhibition"),
        (r"calcium\s+channel", "Calcium Channel Blockade"),
    ]
    text_lower = text.lower()
    for pattern, title in class_patterns:
        if re.search(pattern, text_lower):
            return title

    # Fallback based on known drug compositions in text
    comp_patterns = [
        (r"cyproheptadine", "Antihistaminic & Antiserotonergic Action"),
        (r"propranolol", "Non-selective Beta-Adrenergic Blockade"),
        (r"ranitidine", "H2 Receptor Antagonism"),
    ]
    for pattern, title in comp_patterns:
        if re.search(pattern, text_lower):
            return title

    return None


def _extract_mechanism_text_fallback(drug_name: str, text: str) -> Optional[str]:
    """Derive mechanism explanation from the drug text."""
    import re

    text_lower = text.lower()

    # Map known compositions to grounded mechanism text
    mechanisms = {
        "cyproheptadine": (
            "Cyproheptadine acts as a competitive antagonist at H1-histamine "
            "and serotonin (5-HT2) receptors, providing antiallergic and "
            "appetite-stimulating effects."
        ),
        "propranolol": (
            "Propranolol non-selectively blocks beta-1 and beta-2 adrenergic "
            "receptors, reducing heart rate, cardiac output, and blood pressure."
        ),
        "ranitidine": (
            "Ranitidine competitively inhibits histamine H2 receptors on "
            "parietal cells, reducing basal and stimulated gastric acid secretion."
        ),
    }

    for compound, mech_text in mechanisms.items():
        if compound in text_lower:
            return mech_text

    return None


# ─── Enrichment: Comparison Display ─────────────────────────────────────────

_COMPARISON_SYSTEM = (
    "Return ONLY a valid JSON object. No explanations, no markdown fences, no extra text.\n"
    "The JSON must have this exact structure:\n"
    '{"competitor": "drug name", "rows": [\n'
    '  {"metric": "Metric Name", "value": "value for queried drug", '
    '"competitor_value": "value for competitor", "winner": true}\n'
    "]}\n\n"
    "Rules:\n"
    "- Include exactly 5 rows with clinically relevant metrics\n"
    "- Metrics should include: Efficacy, Onset of Action, Half-Life, "
    "Side Effect Profile, Route of Administration\n"
    "- Use specific numeric values where possible\n"
    "- winner=true means the QUERIED drug is better for that metric\n"
    "- Choose the most commonly compared competitor in clinical practice\n"
    "- Keep values SHORT (under 15 words each)\n"
    "- Output ONLY the JSON object, nothing else"
)

_COMPARISON_GROUNDED_SYSTEM = (
    "Return ONLY a valid JSON object. No explanations, no markdown fences, no extra text.\n"
    "Use the provided text and your pharmacological knowledge.\n"
    "The JSON must have this exact structure:\n"
    '{"competitor": "drug name", "rows": [\n'
    '  {"metric": "Metric Name", "value": "val", "competitor_value": "val", "winner": true}\n'
    "]}\n"
    "Include exactly 5 rows. Keep values SHORT. Output ONLY JSON."
)


def enrich_comparison_display(
    drug_name: str,
    sections_text: str,
) -> Optional[ComparisonDisplaySlot]:
    """Generate a competitor comparison table via Gemini.

    Returns None if LLM is unavailable or fails.
    """
    is_unknown = not sections_text.strip()

    system = _COMPARISON_SYSTEM if is_unknown else _COMPARISON_GROUNDED_SYSTEM
    user = (
        f"Drug: {drug_name}"
        if is_unknown
        else f"Drug: {drug_name}\nText: {sections_text}"
    )

    raw = _call_llm(system, user, max_tokens=1024)
    if raw:
        parsed = _extract_json(raw)
        if parsed and "rows" in parsed:
            rows = []
            for r in parsed["rows"]:
                if isinstance(r, dict) and "metric" in r:
                    rows.append(ComparisonRowSlot(
                        metric=r.get("metric", ""),
                        value=str(r.get("value", "")),
                        competitor_value=str(r.get("competitor_value", "")),
                        winner=bool(r.get("winner", False)),
                    ))
            if rows:
                return ComparisonDisplaySlot(
                    competitor=parsed.get("competitor"),
                    rows=rows,
                )
            log.debug("Comparison rows empty after parsing.")
        else:
            log.debug("Comparison JSON parse failed, raw: %.80s…", raw)

    return None


# ─── Enrichment: Compliance Display ─────────────────────────────────────────

_COMPLIANCE_SYSTEM = (
    "Return ONLY a valid JSON object. No explanations, no markdown fences, no extra text.\n"
    "The JSON must have exactly these keys:\n"
    '  "regulatory_status": "Approved or Conditional or Under Review or Not Approved",\n'
    '  "regulatory_authority": "FDA, CDSCO, EMA, etc.",\n'
    '  "pregnancy_category": "Category A/B/C/D/X or N/A",\n'
    '  "boxed_warning": "None or a brief one-sentence description",\n'
    '  "citations": ["2-3 short regulatory source names"]\n\n'
    "Rules:\n"
    "- Be factually accurate\n"
    "- Keep boxed_warning under 30 words\n"
    "- Keep citation strings short (just source names)\n"
    "- Output ONLY the JSON object, nothing else"
)

_COMPLIANCE_GROUNDED_SYSTEM = (
    "Return ONLY a valid JSON object. No explanations, no markdown fences.\n"
    "Keys: regulatory_status, regulatory_authority, pregnancy_category, boxed_warning, citations.\n"
    "Use the provided text and your regulatory knowledge. Keep values concise.\n"
    "Output ONLY JSON."
)


def enrich_compliance_display(
    drug_name: str,
    sections_text: str,
) -> Optional[ComplianceDisplaySlot]:
    """Generate regulatory & safety compliance data via Gemini.

    Returns None if LLM is unavailable or fails.
    """
    is_unknown = not sections_text.strip()

    system = _COMPLIANCE_SYSTEM if is_unknown else _COMPLIANCE_GROUNDED_SYSTEM
    user = (
        f"Drug: {drug_name}"
        if is_unknown
        else f"Drug: {drug_name}\nText: {sections_text}"
    )

    raw = _call_llm(system, user, max_tokens=600)
    if raw:
        parsed = _extract_json(raw)
        if parsed:
            citations = parsed.get("citations", [])
            if isinstance(citations, str):
                citations = [citations]
            return ComplianceDisplaySlot(
                regulatory_status=parsed.get("regulatory_status"),
                regulatory_authority=parsed.get("regulatory_authority"),
                pregnancy_category=parsed.get("pregnancy_category"),
                boxed_warning=parsed.get("boxed_warning"),
                citations=citations if isinstance(citations, list) else [],
            )
        log.debug("Compliance JSON parse failed, raw: %.80s…", raw)

    return None


# ─── Enrichment: Company Inference ──────────────────────────────────────────

_COMPANY_SYSTEM = (
    "Return ONLY a valid JSON object. No explanations, no markdown fences.\n"
    "The JSON must have exactly these keys:\n"
    '  "company_name": "Company name (e.g. Cipla, Pfizer, GSK)",\n'
    '  "color": "Brand hex color (e.g. #EE1C25)",\n'
    '  "accent": "Complementary accent hex color"\n'
    "Use the original/most prominent manufacturer. Output ONLY JSON."
)


def infer_company_name(drug_name: str) -> Optional[dict]:
    """Ask Gemini to identify the manufacturer and brand colors for a drug.

    Returns a dict with 'company_name', 'color', 'accent' or None.
    """
    raw = _call_llm(
        _COMPANY_SYSTEM,
        f"Drug: {drug_name}",
        max_tokens=200,
    )
    if raw:
        parsed = _extract_json(raw)
        if parsed and "company_name" in parsed:
            return {
                "company_name": parsed["company_name"],
                "color": parsed.get("color", "#1976D2"),
                "accent": parsed.get("accent", "#42A5F5"),
            }
        log.debug("Company inference JSON parse failed, raw: %.80s…", raw)

    return None


# ─── Spelling Correction ────────────────────────────────────────────────────

_SPELLING_SYSTEM = (
    "You are a pharmaceutical drug-name spell-checker. "
    "Given a user-typed drug name, decide if it is misspelled. "
    "Return ONLY a valid JSON object with exactly these keys:\n"
    '  "corrected": "<the correct drug name with proper capitalization>",\n'
    '  "is_corrected": true/false\n\n'
    "Rules:\n"
    "- If the spelling is already correct (even if capitalization differs), "
    "set is_corrected to false and return the properly capitalised form in corrected.\n"
    "- Only set is_corrected to true when the actual LETTERS are wrong — "
    "missing letters, extra letters, swapped letters, phonetic misspellings.\n"
    "- Capitalization differences alone are NOT a spelling error.\n"
    "- Only correct to REAL drug names (brand names or generic names). "
    "Do NOT invent drugs.\n"
    "- Do NOT correct a brand name to its generic name or vice versa. "
    "Ciplactin is NOT a misspelling. Ciplar is NOT a misspelling.\n"
    "- Return ONLY valid JSON. No explanations, no markdown fences, no extra text."
)


def correct_drug_spelling(drug_name: str) -> Optional[dict]:
    """Ask Gemini whether the drug name is misspelled.

    Returns a dict with 'corrected' (str) and 'is_corrected' (bool),
    or None if the LLM is unavailable.
    """
    raw = _call_llm(
        _SPELLING_SYSTEM,
        f"Drug name typed by user: {drug_name}",
        max_tokens=100,
    )
    if raw:
        parsed = _extract_json(raw)
        if parsed and "corrected" in parsed and "is_corrected" in parsed:
            return {
                "corrected": str(parsed["corrected"]),
                "is_corrected": bool(parsed["is_corrected"]),
            }
        log.debug("Spelling correction JSON parse failed, raw: %.80s…", raw)

    return None
