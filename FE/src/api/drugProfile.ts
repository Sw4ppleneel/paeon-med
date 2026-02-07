/**
 * API client for the Paeon DMR backend.
 * All calls go through POST /api/drug-profile on localhost:8000.
 */

import type { DrugProfileRequest, DrugProfileResponse } from '../types/api';

const API_BASE = 'http://localhost:8000';

export async function fetchDrugProfile(
  request: DrugProfileRequest,
): Promise<DrugProfileResponse> {
  const res = await fetch(`${API_BASE}/api/drug-profile`, {
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
