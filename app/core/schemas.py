"""Pydantic v2 schemas for all request/response models.

All API inputs and outputs are strictly typed. Every response is wrapped in CardEnvelope.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ─── Request Models ──────────────────────────────────────────────────────────


class RAGQueryRequest(BaseModel):
    query: str


class ReimbursementRequest(BaseModel):
    drug_name: str
    diagnosis: str
    insurance_type: str
    claim_amount: float


class ReportGenerateRequest(BaseModel):
    drug_name: str
    diagnosis: str
    patient_age: int
    insurance_type: str
    claim_amount: float
    prior_treatments: List[str] = Field(default_factory=list)


class GuardrailRequest(BaseModel):
    text: str


# ─── Card Models ─────────────────────────────────────────────────────────────


class IdentityCard(BaseModel):
    drug_name: str
    sections: List[dict]
    source_ids: List[str]


class ComparisonDrugEntry(BaseModel):
    drug_name: str
    sections: List[dict]
    source_ids: List[str]


class ComparisonMatrix(BaseModel):
    drugs: List[ComparisonDrugEntry]


class TrialEnablementCard(BaseModel):
    drug_name: str
    status: str
    reason_codes: List[str]
    required_documents: List[str]
    exclusion_flags: List[str] = Field(default_factory=list)


class ReimbursementStatusCard(BaseModel):
    drug_name: str
    status: str
    coverage_percent: float
    approved_amount: float
    reason_codes: List[str]


class PolicyReportCard(BaseModel):
    trial_eligibility: TrialEnablementCard
    reimbursement: ReimbursementStatusCard
    generated_at: str
    summary: str


class RefusalCard(BaseModel):
    blocked: bool = True
    reason: str
    violation_type: str = "unspecified"


class ClearanceCard(BaseModel):
    blocked: bool = False
    reason: str = "Query passed compliance check."


class IntelFeedItem(BaseModel):
    drug_name: str
    headline: str
    source_id: str


# ─── Envelope ────────────────────────────────────────────────────────────────


class CardEnvelope(BaseModel):
    card_type: str
    card: Any


class IntelFeedResponse(BaseModel):
    items: List[IntelFeedItem]


class HealthResponse(BaseModel):
    status: str
    engines: dict


# ─── Orchestration: /api/drug-profile ────────────────────────────────────────
# These schemas define the contract between the backend orchestration endpoint
# and the frontend. Fields marked with ENRICHMENT_REQUIRED are placeholders
# that depend on human-provided metadata or future LLM transformation.
# DO NOT populate these fields with assumed defaults.


class DrugProfileRequest(BaseModel):
    """Request for the unified drug profile orchestration endpoint."""
    drug_name: str
    compare_with: Optional[str] = None
    insurance_type: Optional[str] = None
    diagnosis: Optional[str] = None
    claim_amount: Optional[float] = None
    patient_age: Optional[int] = None
    prior_treatments: List[str] = Field(default_factory=list)


# ─── Enrichment Slot Schemas (output shapes for enrichment methods) ──────────
# These define the SHAPE of what enrichment methods must return.
# They are NOT populated by the backend today. They require human input.


class BrandMetadataSlot(BaseModel):
    """Brand metadata resolved from brands.json per drug."""
    name: Optional[str] = None               # e.g. "Cipla"
    color: Optional[str] = None              # e.g. "#00AEEF"
    accent: Optional[str] = None             # e.g. "#F58220"
    tagline: Optional[str] = None            # e.g. "Caring for Life"
    logo_url: Optional[str] = None           # URL or asset path
    division: Optional[str] = None           # e.g. "Respiratory Division"
    background_gradient: Optional[str] = None  # e.g. "light_blue", "deep_blue", "orange"


class CompanyMetadataSlot(BaseModel):
    """ENRICHMENT_REQUIRED: Must be supplied by human for each company."""
    overview: Optional[str] = None
    specialties: Optional[str] = None
    stats: Optional[Dict[str, str]] = None   # founded, headquarters, employees, revenue
    mission: Optional[str] = None


class DrugDisplaySlot(BaseModel):
    """ENRICHMENT_REQUIRED: subtitle, visual, description need human/LLM input."""
    name: str                                # From backend (drug_name)
    subtitle: Optional[str] = None           # e.g. "Cyproheptadine Hydrochloride 4mg | Tablet"
    visual: Optional[str] = None             # Asset reference for 3D visual
    description: Optional[str] = None        # One-liner marketing description


class MechanismSlot(BaseModel):
    """ENRICHMENT_REQUIRED: Must be human-supplied or LLM-generated."""
    title: Optional[str] = None              # e.g. "Antihistaminic Action"
    text: Optional[str] = None               # Mechanism explanation


class ComparisonRowSlot(BaseModel):
    """Single row in a comparison table."""
    metric: str
    value: str
    competitor_value: str
    winner: bool


class ComparisonDisplaySlot(BaseModel):
    """ENRICHMENT_REQUIRED: Structured comparison needs human/LLM transformation."""
    competitor: Optional[str] = None
    rows: List[ComparisonRowSlot] = Field(default_factory=list)


class CoverageSchemeSlot(BaseModel):
    """Single coverage scheme display."""
    status: str                              # e.g. "COVERED", "APPROVED", "NOT COVERED"
    color: str                               # green/blue/yellow/grey
    label: str                               # e.g. "Tier 1"


class CoverageDisplaySlot(BaseModel):
    """Maps backend policy output → frontend display. Mapping rules ENRICHMENT_REQUIRED."""
    government: Optional[CoverageSchemeSlot] = None    # Ayushman Bharat etc.
    corporate: Optional[CoverageSchemeSlot] = None     # CGHS etc.
    private: Optional[CoverageSchemeSlot] = None       # Private TPA


class ComplianceDisplaySlot(BaseModel):
    """ENRICHMENT_REQUIRED: Regulatory data needs human-supplied metadata."""
    regulatory_status: Optional[str] = None
    regulatory_authority: Optional[str] = None
    pregnancy_category: Optional[str] = None
    boxed_warning: Optional[str] = None
    citations: List[str] = Field(default_factory=list)


class PricingSlot(BaseModel):
    """ENRICHMENT_REQUIRED: Pricing must be human-supplied."""
    estimated_copay: Optional[str] = None
    mrp: Optional[str] = None


# ─── Orchestrated Response ───────────────────────────────────────────────────


class DrugProfileResponse(BaseModel):
    """Unified response for /api/drug-profile.

    Contains both backend-supplied data (identity_card, reimbursement)
    and enrichment slots that are null until human input is provided.
    """
    # ── Backend-supplied (available now) ──
    identity_card: Optional[Dict[str, Any]] = None
    comparison_matrix: Optional[Dict[str, Any]] = None
    reimbursement: Optional[Dict[str, Any]] = None
    guardrail_status: Optional[Dict[str, Any]] = None
    source_ids: List[str] = Field(default_factory=list)

    # ── Enrichment slots (WAITING ON HUMAN INPUT) ──
    brand: Optional[BrandMetadataSlot] = None
    company: Optional[CompanyMetadataSlot] = None
    drug_display: Optional[DrugDisplaySlot] = None
    mechanism: Optional[MechanismSlot] = None
    comparison_display: Optional[ComparisonDisplaySlot] = None
    coverage_display: Optional[CoverageDisplaySlot] = None
    compliance_display: Optional[ComplianceDisplaySlot] = None
    pricing: Optional[PricingSlot] = None

    # ── Metadata ──
    enrichment_status: Dict[str, str] = Field(default_factory=dict)
    """Per-slot status: 'available', 'awaiting_human_input', or 'awaiting_llm'."""

    # ── Spelling correction ──
    suggested_name: Optional[str] = None
    """If the LLM detected a misspelling, contains the corrected drug name."""


# ─── Company Overview (Additive — company-first entry) ───────────────────────


class CompanyProfileRequest(BaseModel):
    """Request for the company overview endpoint."""
    company_name: str


class HeroProductSlot(BaseModel):
    """Hero product highlight for a company overview card."""
    drug_name: str
    rationale: str


class CompanyOverviewCard(BaseModel):
    """Structured company overview returned by POST /api/company-profile.

    This is an informational primer only. It does NOT trigger drug intelligence.
    The frontend uses hero_product.drug_name to offer a transition into the
    existing drug-first flow via /api/drug-profile.
    """
    company_name: str
    logo_url: str
    tagline: str
    company_description: str
    mission_statement: str
    hero_product: HeroProductSlot
    supported_specialties: List[str]
    status: str = Field(
        description="Resolution status: 'available' or 'unknown_company'."
    )


# ─── Drug Search (lightweight, no LLM) ──────────────────────────────────────


class DrugSearchRequest(BaseModel):
    """Request for the lightweight drug search endpoint."""
    drug_name: str


class DrugSearchResult(BaseModel):
    """Lightweight drug search result — no LLM, instant response."""
    drug_name: str
    found: bool
    sections: List[dict] = Field(default_factory=list)
    source_ids: List[str] = Field(default_factory=list)
    brand: Optional[BrandMetadataSlot] = None
    company: Optional[CompanyMetadataSlot] = None
    suggested_name: Optional[str] = None


# ─── Ask / General Q&A (LLM-powered) ────────────────────────────────────────


class AskRequest(BaseModel):
    """Request for the general LLM Q&A endpoint."""
    question: str
    drug_context: Optional[str] = None  # Optional: current drug being viewed


class AskResponse(BaseModel):
    """LLM-generated answer for general pharma questions."""
    question: str
    answer: str
    drug_context: Optional[str] = None
    status: str = Field(
        description="'answered', 'refused', or 'error'."
    )
