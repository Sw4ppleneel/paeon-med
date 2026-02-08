/**
 * API client for POST /api/ask — general LLM Q&A.
 * Used by the "Talk More" conversation panel.
 * Completely separate from drug search / company search.
 */

import type { AskRequest, AskResponse } from '../types/api';

const API_BASE = 'http://localhost:8000';

export async function fetchAsk(
  request: AskRequest,
): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/api/ask`, {
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
