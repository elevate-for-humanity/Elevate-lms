'use client';

import { useEffect } from 'react';

export default function UnregisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we've already run cleanup for this deployment
    const cleanupVersion = '2026-01-07';
    const hasRun = sessionStorage.getItem('sw-cleanup-version');

    if (hasRun === cleanupVersion) {
      return; // Already cleaned up this session
    }

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
    }

    // Clear cache storage
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }

    // Mark as completed for this session
    sessionStorage.setItem('sw-cleanup-version', cleanupVersion);
  }, []);

  return null;
}
