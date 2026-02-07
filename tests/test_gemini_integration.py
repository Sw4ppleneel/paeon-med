"""Phase 3: Tests for Gemini LLM integration in the llm_adapter.

Verifies:
  - Gemini singleton lifecycle (init, reset)
  - Graceful fallback when API key is absent
  - Correct behaviour when Gemini returns text (mocked)
  - llm_adapter still does NOT import engines
  - _call_llm returns None on exception (both models)
  - Model fallback: primary → fallback → rule-based
  - Proper system_instruction via GenerateContentConfig
  - Batched JSON enrichment (drug_display + mechanism in single calls)
  - JSON extraction from LLM responses
"""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch, call

import pytest

from app.core.llm_adapter import (
    _call_llm,
    _extract_json,
    _get_gemini_client,
    enrich_drug_display,
    enrich_mechanism_summary,
    reset_gemini,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

SAMPLE_TEXT = (
    "Ciplactin (Cyproheptadine Hydrochloride 4mg) is manufactured by Cipla Ltd. "
    "It is indicated for allergic rhinitis, urticaria, and appetite stimulation. "
    "Available as tablets."
)


@pytest.fixture(autouse=True)
def _clean_gemini_state():
    """Ensure each test starts with a clean Gemini singleton."""
    reset_gemini()
    yield
    reset_gemini()


# ─── Gemini initialisation tests ────────────────────────────────────────────


def test_gemini_not_initialised_without_key():
    """With no GEMINI_API_KEY, _get_gemini_client returns None."""
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("GEMINI_API_KEY", None)
        reset_gemini()
        assert _get_gemini_client() is None


def test_call_llm_returns_none_without_key():
    """_call_llm returns None when Gemini is not configured."""
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("GEMINI_API_KEY", None)
        reset_gemini()
        result = _call_llm("system", "user")
        assert result is None


def test_reset_gemini_clears_singleton():
    """reset_gemini clears the client instance so it can be re-initialised."""
    import app.core.llm_adapter as la

    la._gemini_client = "fake_client"
    reset_gemini()
    assert la._gemini_client is None


# ─── Mock Gemini call tests ─────────────────────────────────────────────────


def _make_mock_client(responses=None, side_effect=None):
    """Create a mock Gemini client matching google.genai.Client interface.

    The mock matches: client.models.generate_content(model=..., contents=..., config=...)
    """
    mock_client = MagicMock()
    if side_effect:
        mock_client.models.generate_content.side_effect = side_effect
    elif responses is not None:
        call_count_holder = [0]

        def fake_generate(**kwargs):
            resp = MagicMock()
            idx = call_count_holder[0]
            resp.text = responses[idx] if idx < len(responses) else None
            call_count_holder[0] += 1
            return resp

        mock_client.models.generate_content.side_effect = fake_generate
    else:
        mock_resp = MagicMock()
        mock_resp.text = None
        mock_client.models.generate_content.return_value = mock_resp
    return mock_client


def test_call_llm_returns_text_when_gemini_available():
    """When Gemini is mocked, _call_llm returns the model's text."""
    mock_client = _make_mock_client(responses=["Cyproheptadine Hydrochloride 4mg | Tablet"])

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = _call_llm("Extract subtitle", f"Drug: Ciplactin\nText: {SAMPLE_TEXT}")
    assert result == "Cyproheptadine Hydrochloride 4mg | Tablet"
    mock_client.models.generate_content.assert_called_once()

    # Verify that system_instruction is passed via config, not in contents
    call_kwargs = mock_client.models.generate_content.call_args
    assert "config" in call_kwargs.kwargs or (call_kwargs[1] and "config" in call_kwargs[1])


def test_call_llm_returns_none_on_empty_response():
    """When Gemini returns empty text, _call_llm returns None."""
    mock_client = _make_mock_client(responses=[""])

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = _call_llm("system", "user")
    assert result is None


def test_call_llm_returns_none_on_exception():
    """When both Gemini models raise, _call_llm returns None gracefully."""
    mock_client = _make_mock_client(side_effect=RuntimeError("API quota exceeded"))

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = _call_llm("system", "user")
    assert result is None


def test_call_llm_returns_none_when_text_is_none():
    """When response.text is None, _call_llm returns None."""
    mock_client = _make_mock_client()  # default returns None text

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = _call_llm("system", "user")
    assert result is None


# ─── Model fallback tests ───────────────────────────────────────────────────


def test_call_llm_falls_back_to_secondary_model():
    """When primary model fails, _call_llm tries the fallback model."""
    import app.core.llm_adapter as la

    call_count = [0]

    def model_specific_response(**kwargs):
        call_count[0] += 1
        model = kwargs.get("model", "")
        if model == la._GEMINI_MODEL:
            raise RuntimeError("Primary model quota exceeded")
        resp = MagicMock()
        resp.text = "Fallback response"
        return resp

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = model_specific_response
    la._gemini_client = mock_client

    result = _call_llm("system", "user")
    assert result == "Fallback response"
    assert call_count[0] == 2  # primary + fallback


def test_call_llm_skips_fallback_when_same_model():
    """When fallback model == primary model, don't retry the same model."""
    import app.core.llm_adapter as la

    original_fallback = la._GEMINI_FALLBACK_MODEL
    la._GEMINI_FALLBACK_MODEL = la._GEMINI_MODEL  # same model

    mock_client = _make_mock_client(side_effect=RuntimeError("quota exceeded"))
    la._gemini_client = mock_client

    result = _call_llm("system", "user")
    assert result is None
    # Should only be called once (no fallback retry)
    assert mock_client.models.generate_content.call_count == 1

    la._GEMINI_FALLBACK_MODEL = original_fallback


# ─── Enrichment with mocked Gemini ──────────────────────────────────────────


def test_enrich_drug_display_uses_gemini():
    """enrich_drug_display uses a single batched Gemini call for subtitle+description."""
    json_response = '{"subtitle": "Cyproheptadine HCl 4mg | Tablet", "description": "An antihistamine indicated for allergic rhinitis, urticaria, and appetite stimulation. Contraindicated in glaucoma and concurrent MAO inhibitor use. Common side effects include drowsiness and weight gain."}'
    mock_client = _make_mock_client(responses=[json_response])

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = enrich_drug_display("Ciplactin", SAMPLE_TEXT)
    assert result.name == "Ciplactin"
    assert result.subtitle == "Cyproheptadine HCl 4mg | Tablet"
    assert "antihistamine" in result.description.lower()
    # Only ONE call (batched)
    assert mock_client.models.generate_content.call_count == 1


def test_enrich_mechanism_uses_gemini():
    """enrich_mechanism_summary uses a single batched Gemini call for title+text."""
    json_response = '{"title": "H1/5-HT2 Receptor Antagonism", "text": "Cyproheptadine is a first-generation antihistamine that competitively blocks H1-histamine and serotonin 5-HT2 receptors. This dual antagonism provides antiallergic, antipruritic, and appetite-stimulating effects."}'
    mock_client = _make_mock_client(responses=[json_response])

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = enrich_mechanism_summary("Ciplactin", SAMPLE_TEXT)
    assert result.title == "H1/5-HT2 Receptor Antagonism"
    assert "H1" in result.text or "histamine" in result.text.lower()
    # Only ONE call (batched)
    assert mock_client.models.generate_content.call_count == 1


def test_enrich_drug_display_falls_back_when_gemini_fails():
    """If Gemini raises, enrich_drug_display falls back to rule-based."""
    mock_client = _make_mock_client(side_effect=RuntimeError("network error"))

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = enrich_drug_display("Ciplactin", SAMPLE_TEXT)
    assert result.name == "Ciplactin"
    # Fallback should still extract subtitle from text
    assert result.subtitle is not None
    assert "Cyproheptadine" in result.subtitle


def test_enrich_mechanism_falls_back_when_gemini_fails():
    """If Gemini raises, enrich_mechanism_summary falls back to rule-based."""
    mock_client = _make_mock_client(side_effect=RuntimeError("network error"))

    import app.core.llm_adapter as la
    la._gemini_client = mock_client

    result = enrich_mechanism_summary("Ciplactin", SAMPLE_TEXT)
    assert result.title is not None
    assert result.text is not None
    assert "cyproheptadine" in result.text.lower()


# ─── Architecture isolation tests ───────────────────────────────────────────


def test_llm_adapter_imports_no_engines():
    """llm_adapter must NOT import from either engine."""
    import inspect
    import app.core.llm_adapter as la

    source = inspect.getsource(la)
    import_lines = [
        line.strip()
        for line in source.splitlines()
        if line.strip().startswith("import ") or line.strip().startswith("from ")
    ]
    for line in import_lines:
        assert "product_intelligence" not in line
        assert "policy_reimbursement" not in line
        assert "guardrails" not in line


def test_llm_adapter_uses_dotenv():
    """llm_adapter should import and use python-dotenv."""
    import inspect
    import app.core.llm_adapter as la

    source = inspect.getsource(la)
    assert "from dotenv import load_dotenv" in source or "import dotenv" in source


def test_gemini_model_name_default():
    """Default Gemini model should be gemini-2.0-flash (or overridden by env)."""
    import app.core.llm_adapter as la
    # The default is gemini-2.0-flash, but can be overridden via GEMINI_MODEL env var
    expected = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    assert la._GEMINI_MODEL == expected


# ─── JSON extraction tests ──────────────────────────────────────────────────


def test_extract_json_plain():
    """_extract_json parses plain JSON."""
    result = _extract_json('{"title": "Test", "text": "Hello"}')
    assert result == {"title": "Test", "text": "Hello"}


def test_extract_json_with_code_fences():
    """_extract_json strips markdown code fences."""
    raw = '```json\n{"title": "Test", "text": "Hello"}\n```'
    result = _extract_json(raw)
    assert result == {"title": "Test", "text": "Hello"}


def test_extract_json_returns_none_on_invalid():
    """_extract_json returns None for non-JSON text."""
    result = _extract_json("This is not JSON at all")
    assert result is None
