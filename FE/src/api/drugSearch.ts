/**
 * API client for POST /api/drug-search — fast, lightweight drug lookup.
 * No heavy LLM enrichment. Used by the top search bar.
 */

import type { DrugSearchRequest, DrugSearchResponse } from '../types/api';

const API_BASE = 'http://localhost:8000';

export async function fetchDrugSearch(
  request: DrugSearchRequest,
): Promise<DrugSearchResponse> {
  const res = await fetch(`${API_BASE}/api/drug-search`, {
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
