'use client';

import { useState, useEffect } from 'react';

export interface Program {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  estimated_weeks?: number;
  duration_weeks?: number;
  estimated_hours?: number;
  price?: number;
  total_cost?: number;
  funding_tags?: string[];
  is_active: boolean;
  image_url?: string;
}

export function usePrograms(category?: string) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const url = category
          ? `/api/programs?category=${encodeURIComponent(category)}`
          : '/api/programs';
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'success' && data.programs) {
          setPrograms(data.programs);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to fetch programs');
        console.error('Failed to fetch programs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, [category]);

  return { programs, loading, error };
}

export function useProgramNames() {
  const { programs, loading, error } = usePrograms();
  const names = programs.map((p) => p.name || p.title || p.slug);
  return { programNames: names, loading, error };
}
