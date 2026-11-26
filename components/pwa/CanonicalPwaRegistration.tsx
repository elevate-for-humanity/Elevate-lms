'use client';

import { useEffect } from 'react';
import { PwaUpdateNotice } from './PwaUpdateNotice';
import { PWA_APPLICATIONS, type PwaApplication } from '@/lib/pwa/registry';
import {
  capturePwaInstallPrompt,
  clearPwaInstallPrompt,
} from '@/lib/pwa/install-prompt';

// Sibling applications share an origin (Elevate Mail lives on the Admin
// origin under /mail/). Their workers and caches are their own install
// identity: one application's registration pass must never unregister or
// purge a sibling, or installing/using one app would break the other.
// The sibling sets are derived inside removeStaleWorkers, not at module
// scope: they are only needed in a real browser with the registry loaded.
async function removeStaleWorkers(workerPath: string, cachePrefix: string) {
  const knownWorkerPaths = new Set<string>(
    Object.values(PWA_APPLICATIONS).map((app) => app.workerPath),
  );
  const knownCachePrefixes = Object.values(PWA_APPLICATIONS).map(
    (app) => app.cachePrefix,
  );
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(async (registration) => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) {
      await registration.unregister();
      return;
    }
    const script = new URL(worker.scriptURL);
    if (
      script.origin !== window.location.origin ||
      (script.pathname !== workerPath && !knownWorkerPaths.has(script.pathname))
    ) {
      await registration.unregister();
    }
  }));

  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(
          (name) =>
            name.startsWith('elevate-') &&
            !name.startsWith(cachePrefix) &&
            !knownCachePrefixes.some((prefix) => name.startsWith(prefix)),
        )
        .map((name) => caches.delete(name)),
    );
  }
}

async function purgeBrokenPwaState(workerPath: string, cachePrefix: string) {
  // Reset only the failing application's own state. On single-application
  // origins this is everything there is; on the shared Admin origin it
  // leaves sibling applications (and the workspace launchers) intact.
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(async (registration) => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) {
      await registration.unregister();
      return;
    }
    const script = new URL(worker.scriptURL);
    if (script.origin !== window.location.origin || script.pathname === workerPath) {
      await registration.unregister();
    }
  }));

  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(cachePrefix)).map((name) => caches.delete(name)));
  }
}

export function CanonicalPwaRegistration({ application }: { application: PwaApplication }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const config = PWA_APPLICATIONS[application];
    let cancelled = false;
    let hadController = Boolean(navigator.serviceWorker.controller);
    const cleanups: Array<() => void> = [];

    const announceControllerChange = () => {
      if (cancelled) return;
      // Never reload an active page automatically. A controller change can occur
      // while a user is typing a password, uploading a document, or signing a
      // form; reloading here destroys that work. The application-level update
      // notice lets the user refresh at a safe point.
      if (hadController) window.dispatchEvent(new CustomEvent('elevate-pwa-controller-changed'));
      hadController = Boolean(navigator.serviceWorker.controller);
    };

    navigator.serviceWorker.addEventListener('controllerchange', announceControllerChange);
    window.addEventListener('beforeinstallprompt', capturePwaInstallPrompt);
    window.addEventListener('appinstalled', clearPwaInstallPrompt);

    const register = async () => {
      try {
        // Clean incompatible registrations first. Previously this happened only
        // after a successful worker probe, which left a broken/stale worker in
        // control when a deployment temporarily returned 404/5xx for the new
        // worker. Installed Android PWAs could then fail before React recovered.
        await removeStaleWorkers(config.workerPath, config.cachePrefix);
        if (cancelled) return;

        // Native registration validates the same-origin script and its response.
        // Extra page probes and an immediate update duplicate that work and can
        // race navigation in WebKit on every dashboard mount.
        const registration = await navigator.serviceWorker.register(config.workerPath, {
          scope: config.scope,
          updateViaCache: 'none',
        });

        if (cancelled) return;
        const announceUpdate = () => {
          // An installing worker reaching "installed" is not sufficient evidence
          // that an actionable update is waiting. Otherwise an unchanged PWA
          // can repeatedly display an update button that only reloads the page.
          if (!cancelled && registration.waiting && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('elevate-pwa-update-ready', { detail: registration }));
          }
        };
        const observeInstalling = () => {
          // Browsers clear registration.installing as the worker advances.
          const worker = registration.installing;
          if (!worker) return;
          const onStateChange = () => {
            if (worker.state === 'installed') announceUpdate();
          };
          worker.addEventListener('statechange', onStateChange);
          cleanups.push(() => worker.removeEventListener('statechange', onStateChange));
        };
        registration.addEventListener('updatefound', observeInstalling);
        cleanups.push(() => registration.removeEventListener('updatefound', observeInstalling));
        observeInstalling();
        if (registration.waiting) announceUpdate();

        // A failed update check while offline must not unregister a healthy PWA.
        const checkForUpdate = () => { void registration.update().catch(() => {}); };
        const onVisible = () => { if (document.visibilityState === 'visible') checkForUpdate(); };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('online', checkForUpdate);
        cleanups.push(() => {
          document.removeEventListener('visibilitychange', onVisible);
          window.removeEventListener('online', checkForUpdate);
        });

        // register() already checked the worker; subsequent checks are driven
        // by reconnect/visibility events rather than this same navigation.
      } catch (error) {
        if (cancelled) return;
        // A registration exception must not leave an obsolete worker controlling
        // the installed app. Reset PWA state so the next navigation uses network.
        try {
          await purgeBrokenPwaState(config.workerPath, config.cachePrefix);
        } catch {
          // Browser cleanup is best-effort; never block the application shell.
        }
        if (process.env.NODE_ENV !== 'production') console.warn(`[pwa] ${application} registration failed`, error);
      }
    };

    void register();
    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      navigator.serviceWorker.removeEventListener('controllerchange', announceControllerChange);
      window.removeEventListener('beforeinstallprompt', capturePwaInstallPrompt);
      window.removeEventListener('appinstalled', clearPwaInstallPrompt);
    };
  }, [application]);

  // Operational portals need the shared loaded-build check and an explicit,
  // user-controlled update. Keep public marketing pages free of update banners.
  return application === 'marketing' ? null : <PwaUpdateNotice />;
}
