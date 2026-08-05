'use client';

import { useEffect } from 'react';

/**
 * Registers the marketing domain service worker (sw-marketing.js).
 * Mount once in the marketing root layout.
 */
export function MarketingPwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw-marketing.js', {
          scope: '/',
        });
      } catch (error) {
        console.error('[pwa] Marketing service-worker registration failed', error);
      }
    };

    void register();
  }, []);

  return null;
}

