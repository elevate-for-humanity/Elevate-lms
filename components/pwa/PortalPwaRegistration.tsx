'use client';

import { useEffect } from 'react';

/**
 * Registers the portal domain service worker (sw-portal.js).
 * Mount once in the apps/app root layout.
 */
export function PortalPwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw-portal.js', {
          scope: '/',
        });
      } catch (error) {
        console.error('[pwa] Portal service-worker registration failed', error);
      }
    };

    void register();
  }, []);

  return null;
}
