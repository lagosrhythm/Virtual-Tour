import { useCallback, useEffect, useState } from 'react';
import { RECOMMENDED_TOURS } from '../data/recommendedTours';
import { getRecommendedTours } from '../lib/api';
import { RecommendedTour } from '../types';

export function useRecommendedTours() {
  const [tours, setTours] = useState<RecommendedTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTours = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getRecommendedTours();
      setTours(data);
    } catch (err) {
      setTours(RECOMMENDED_TOURS);
      setError(err instanceof Error ? err.message : 'Could not load recommended tours.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTours();
  }, [loadTours]);

  return { tours, isLoading, error, retry: loadTours };
}
