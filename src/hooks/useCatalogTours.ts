import { useCallback, useEffect, useState } from 'react';
import { getCatalogTours, type CatalogTourApi } from '../lib/api';
import { TOURS, CATS } from '../constants';
import type { TourCategory } from '../types';

// Static fallback — maps constants.ts TOURS to CatalogTourApi shape
const STATIC_FALLBACK: CatalogTourApi[] = TOURS.map(t => ({
  id: String(t.id),
  title: t.title,
  category: t.category,
  duration: t.duration,
  description: '',
  imageUrl: t.imgClass.match(/url\('(.+?)'\)/)?.[1] ?? '',
  free: t.isFree ?? true,
  views: t.views,
  trend: t.trend,
  visibility: 'public' as const,
}));

export const CATALOG_CATEGORIES: TourCategory[] = CATS;

export function useCatalogTours(): { tours: CatalogTourApi[]; isLoading: boolean; error: string | null; retry: () => Promise<void> } {
  const [tours, setTours] = useState<CatalogTourApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCatalogTours();
      setTours(res.data.length > 0 ? res.data : STATIC_FALLBACK);
    } catch (err) {
      setTours(STATIC_FALLBACK);
      setError(err instanceof Error ? err.message : 'Could not load catalog.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { tours, isLoading, error, retry: load };
}
