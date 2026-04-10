'use client';

import { useEffect } from 'react';

// Bump this string on every deploy to force SW update on all clients.
// Format: YYYY-MM-DD-vN
const DEPLOY_VERSION = '2026-06-17-v1';

export default function PWAManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // On first load after a new deploy, clear all old caches so users
    // never see stale content. The SW itself handles cache versioning,
    // but this client-side check catches edge cases where the SW hasn't
    // activated yet (e.g. first visit after a hard refresh).
    const lastDeploy = localStorage.getItem('elevate-deploy-version');
    if (lastDeploy !== DEPLOY_VERSION) {
      if ('caches' in window) {
        caches.keys().then(keys =>
          Promise.all(
            keys
              .filter(k => !k.includes('v7')) // keep current cache version
              .map(k => caches.delete(k))
          )
        ).catch(() => {});
      }
      localStorage.setItem('elevate-deploy-version', DEPLOY_VERSION);
    }

    // Register the service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(reg => {
        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);

        // When a new SW is waiting, activate it immediately
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW ready — skip waiting and reload to get fresh content
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        // SW registration failed — site still works, just no offline support
      });

    // When SW takes control, reload once to ensure fresh assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}
