'use client';

import { useEffect } from 'react';
import { PWA_APPLICATIONS, type PwaApplication } from '@/lib/pwa/registry';

async function removeStaleWorkers(workerPath: string, cachePrefix: string) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(async (registration) => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) return;
    const script = new URL(worker.scriptURL);
    if (script.origin !== window.location.origin || script.pathname !== workerPath) {
      await registration.unregister();
    }
  }));

  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('elevate-') && !name.startsWith(cachePrefix)).map((name) => caches.delete(name)));
  }
}

export function CanonicalPwaRegistration({ application }: { application: PwaApplication }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const config = PWA_APPLICATIONS[application];
    let cancelled = false;

    const register = async () => {
      try {
        const probe = await fetch(config.workerPath, { cache: 'no-store', credentials: 'same-origin' });
        if (!probe.ok || cancelled) return;
        await removeStaleWorkers(config.workerPath, config.cachePrefix);
        if (cancelled) return;
        const registration = await navigator.serviceWorker.register(config.workerPath, { scope: '/', updateViaCache: 'none' });
        registration.addEventListener('updatefound', () => {
          registration.installing?.addEventListener('statechange', () => {
            if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('elevate-pwa-update-ready', { detail: registration }));
            }
          });
        });
        await registration.update();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[pwa] ${application} registration failed`, error);
      }
    };

    void register();
    return () => { cancelled = true; };
  }, [application]);

  return null;
}
