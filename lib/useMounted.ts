'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true only after the component mounts on the client.
 * Use to guard any rendering that depends on browser-only values
 * (Date, window, locale) to avoid SSR hydration mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
