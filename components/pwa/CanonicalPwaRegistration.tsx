'use client';

import { useEffect } from 'react';
import { PWA_APPLICATIONS, type PwaApplication } from '@/lib/pwa/registry';

async function removeStaleWorkers(workerPath: string, cachePrefix: string) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(async (registration) => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) {
      await registration.unregister();
      return;
    }
    const script = new URL(worker.scriptURL);
    if (script.origin !== window.location.origin || script.pathname !== workerPath) {
      await registration.unregister();
    }
  }));

  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith('elevate-') && !name.startsWith(cachePrefix))
        .map((name) => caches.delete(name)),
    );
  }
}

async function purgeBrokenPwaState() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('elevate-')).map((name) => caches.delete(name)));
  }
}

export function CanonicalPwaRegistration({ application }: { application: PwaApplication }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const config = PWA_APPLICATIONS[application];
    let cancelled = false;
    let reloadingForControllerChange = false;
    const hadControllerAtMount = Boolean(navigator.serviceWorker.controller);

    const activateCurrentBuild = () => {
      if (cancelled || reloadingForControllerChange) return;

      // The first worker installation on a fresh browser also emits
      // controllerchange. Reloading in that case can abort an in-flight login,
      // upload, or signature request. Only refresh when this page was already
      // controlled at mount and a newer worker replaces the active build.
      if (!hadControllerAtMount) return;

      reloadingForControllerChange = true;
      window.location.reload();
    };

    // Installed Android PWAs can keep the previous JavaScript bundle alive
    // after a successful production rollout. Reload exactly once when a newer
    // worker replaces an existing controller so the visible app and deployed
    // server cannot drift.
    navigator.serviceWorker.addEventListener('controllerchange', activateCurrentBuild);

    const register = async () => {
      try {
        // Clean incompatible registrations first. Previously this happened only
        // after a successful worker probe, which left a broken/stale worker in
        // control when a deployment temporarily returned 404/5xx for the new
        // worker. Installed Android PWAs could then fail before React recovered.
        await removeStaleWorkers(config.workerPath, config.cachePrefix);
        if (cancelled) return;

        const probe = await fetch(`${config.workerPath}?v=${encodeURIComponent(process.env.NEXT_PUBLIC_GIT_SHA || 'current')}`, {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'cache-control': 'no-cache' },
        });

        if (!probe.ok) {
          await purgeBrokenPwaState();
          return;
        }
        if (cancelled) return;

        const registration = await navigator.serviceWorker.register(config.workerPath, {
          scope: '/',
          updateViaCache: 'none',
        });

        registration.addEventListener('updatefound', () => {
          registration.installing?.addEventListener('statechange', () => {
            if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('elevate-pwa-update-ready', { detail: registration }));
            }
          });
        });

        await registration.update();
      } catch (error) {
        // A registration exception must not leave an obsolete worker controlling
        // the installed app. Reset PWA state so the next navigation uses network.
        try {
          await purgeBrokenPwaState();
        } catch {
          // Browser cleanup is best-effort; never block the application shell.
        }
        if (process.env.NODE_ENV !== 'production') console.warn(`[pwa] ${application} registration failed`, error);
      }
    };

    void register();
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', activateCurrentBuild);
    };
  }, [application]);

  return null;
}
