'use client';

import { useEffect } from 'react';

/**
 * Registers the LMS domain service worker (sw-lms.js).
 * Mount once in the LMS root layout.
 */
export function LmsPwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw-lms.js', {
          scope: '/',
        });
      } catch (error) {
        console.error('[pwa] LMS service-worker registration failed', error);
      }
    };

    void register();
  }, []);

  return null;
}
