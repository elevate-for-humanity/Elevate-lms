'use client';

import { useEffect } from 'react';

// Injected at build time — unique per deploy, no manual bumping needed.
const DEPLOY_VERSION = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';

export default function PWAManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Defer all SW work until the browser is idle — never block page load.
    const register = () => {
      // On new deploy: clear stale caches. Done lazily so it never delays
      // first paint. The SW handles versioning; this is just a safety net.
      const lastDeploy = localStorage.getItem('elevate-deploy-version');
      if (lastDeploy !== DEPLOY_VERSION) {
        if ('caches' in window) {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .catch(() => {});
        }
        localStorage.setItem('elevate-deploy-version', DEPLOY_VERSION);
      }

      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          setInterval(() => reg.update(), 60 * 60 * 1000);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch(() => {});

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        const key = 'elevate-sw-reload';
        if (sessionStorage.getItem(key)) {
          sessionStorage.removeItem(key);
          return;
        }
        sessionStorage.setItem(key, '1');
        window.location.reload();
      });
    };

    // Use requestIdleCallback when available, otherwise defer 4s after load
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(register, { timeout: 5000 });
    } else {
      setTimeout(register, 4000);
    }
  }, []);

  return null;
}
