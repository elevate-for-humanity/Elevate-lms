'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the current Date, but only after mount.
 * Returns null on first render (server + client pre-hydration) so both sides
 * produce identical output, eliminating hydration mismatches from new Date().
 *
 * Usage:
 *   const now = useNow();
 *   const year = now?.getFullYear() ?? new Date().getFullYear(); // fallback for SSR
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);
  return now;
}

/**
 * Returns the current full year as a string, safe for copyright notices.
 * Renders empty string on server, fills in after mount — no hydration mismatch.
 */
export function useCurrentYear(): number {
  const [year, setYear] = useState(0);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return year;
}
