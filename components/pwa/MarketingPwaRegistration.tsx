'use client';

import { useEffect } from 'react';

const MARKETING_WORKER_PATH = '/sw-marketing.js';

/**
 * Registers the one canonical service worker for the marketing origin.
 * Any legacy root-scope worker (for example /sw.js) is removed first so an
 * older registration cannot continue controlling Marketing after a deploy.
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
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            const worker = registration.active ?? registration.waiting ?? registration.installing;
            if (!worker) return;

            const scriptUrl = new URL(worker.scriptURL);
            const isCanonicalMarketingWorker =
              scriptUrl.origin === window.location.origin &&
              scriptUrl.pathname === MARKETING_WORKER_PATH;

            if (!isCanonicalMarketingWorker) {
              await registration.unregister();
            }
          }),
        );

        const registration = await navigator.serviceWorker.register(MARKETING_WORKER_PATH, {
          scope: '/',
          updateViaCache: 'none',
        });
        await registration.update();
      } catch (error) {
        console.error('[pwa] Marketing service-worker registration failed', error);
      }
    };

    void register();
  }, []);

  return null;
}
