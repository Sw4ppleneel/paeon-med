/**
 * React hook for fetching a drug profile from the backend.
 * Manages loading, error, and data states.
 */

import { useState, useCallback } from 'react';
import { fetchDrugProfile } from '../api/drugProfile';
import type { DrugProfileRequest, DrugProfileResponse } from '../types/api';

export interface UseDrugProfileResult {
  data: DrugProfileResponse | null;
  loading: boolean;
  error: string | null;
  fetch: (request: DrugProfileRequest) => Promise<void>;
  reset: () => void;
}

export function useDrugProfile(): UseDrugProfileResult {
  const [data, setData] = useState<DrugProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (request: DrugProfileRequest) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetchDrugProfile(request);
      setData(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch drug profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, fetch: fetchProfile, reset };
}
