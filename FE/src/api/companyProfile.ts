/**
 * API client for POST /api/company-profile — deterministic company lookup.
 * No LLM. Used by the top search bar when in Company mode.
 */

import type { CompanyProfileRequest, CompanyOverviewCard } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchCompanyProfile(
  request: CompanyProfileRequest,
): Promise<CompanyOverviewCard> {
  const res = await fetch(`${API_BASE}/api/company-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}
