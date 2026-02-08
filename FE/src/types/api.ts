/**
 * TypeScript types matching the backend DrugProfileResponse.
 * Auto-generated from app/core/schemas.py — keep in sync.
 */

export interface BrandMetadata {
  name: string | null;
  color: string | null;
  accent: string | null;
  tagline: string | null;
  logo_url: string | null;
  division: string | null;
  background_gradient: string | null;
}

export interface CompanyMetadata {
  overview: string | null;
  specialties: string | null;
  stats: Record<string, string> | null;
  mission: string | null;
}

export interface DrugDisplay {
  name: string;
  subtitle: string | null;
  visual: string | null;
  description: string | null;
}

export interface MechanismData {
  title: string | null;
  text: string | null;
}

export interface CoverageScheme {
  status: string;
  color: string;
  label: string;
}

export interface CoverageDisplay {
  government: CoverageScheme | null;
  corporate: CoverageScheme | null;
  private: CoverageScheme | null;
}

export interface ComparisonRow {
  metric: string;
  value: string;
  competitor_value: string;
  winner: boolean;
}

export interface ComparisonDisplay {
  competitor: string | null;
  rows: ComparisonRow[];
}

export interface ComplianceDisplay {
  regulatory_status: string | null;
  regulatory_authority: string | null;
  pregnancy_category: string | null;
  boxed_warning: string | null;
  citations: string[];
}

export interface DrugProfileResponse {
  // Backend-supplied
  identity_card: Record<string, any> | null;
  comparison_matrix: Record<string, any> | null;
  reimbursement: Record<string, any> | null;
  guardrail_status: Record<string, any> | null;
  source_ids: string[];

  // Enrichment slots
  brand: BrandMetadata | null;
  company: CompanyMetadata | null;
  drug_display: DrugDisplay | null;
  mechanism: MechanismData | null;
  comparison_display: ComparisonDisplay | null;
  coverage_display: CoverageDisplay | null;
  compliance_display: ComplianceDisplay | null;
  pricing: any | null;

  // Metadata
  enrichment_status: Record<string, string>;

  // Spelling correction
  suggested_name: string | null;
}

export interface DrugProfileRequest {
  drug_name: string;
  compare_with?: string;
  insurance_type?: string;
  diagnosis?: string;
  claim_amount?: number;
  patient_age?: number;
  prior_treatments?: string[];
}

// ─── Drug Search (lightweight, fast) ────────────────────────────────────────

export interface DrugSearchRequest {
  drug_name: string;
}

export interface DrugSearchResponse {
  drug_name: string;
  found: boolean;
  sections: Record<string, any>[];
  source_ids: string[];
  brand: BrandMetadata | null;
  company: CompanyMetadata | null;
  suggested_name: string | null;
}

// ─── Company Profile ────────────────────────────────────────────────────────

export interface CompanyProfileRequest {
  company_name: string;
}

export interface HeroProduct {
  drug_name: string;
  rationale: string;
}

export interface CompanyOverviewCard {
  company_name: string;
  logo_url: string;
  tagline: string;
  company_description: string;
  mission_statement: string;
  hero_product: HeroProduct;
  supported_specialties: string[];
  status: 'available' | 'unknown_company';
}

// ─── Ask / General Q&A ─────────────────────────────────────────────────────

export interface AskRequest {
  question: string;
  drug_context?: string;
}

export interface AskResponse {
  question: string;
  answer: string;
  drug_context: string | null;
  status: 'answered' | 'refused' | 'error';
}
