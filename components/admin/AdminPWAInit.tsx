'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for the admin PWA.
 * Drop into the admin layout once — no UI output.
 */
export default function AdminPWAInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {/* SW registration is best-effort */});
    }
  }, []);

  return null;
}
