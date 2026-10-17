'use client';

import { useEffect } from 'react';
import { PWA_APPLICATIONS, type PwaApplication } from '@/lib/pwa/registry';
import { PwaUpdateNotice } from './PwaUpdateNotice';
import {
  capturePwaInstallPrompt,
  clearPwaInstallPrompt,
} from '@/lib/pwa/install-prompt';

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

        if (cancelled) return;
        const announceUpdate = () => {
          if (!cancelled && navigator.serviceWorker.controller) {
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

        checkForUpdate();
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
      cleanups.forEach((cleanup) => cleanup());
      navigator.serviceWorker.removeEventListener('controllerchange', announceControllerChange);
      window.removeEventListener('beforeinstallprompt', capturePwaInstallPrompt);
      window.removeEventListener('appinstalled', clearPwaInstallPrompt);
    };
  }, [application]);

  return <PwaUpdateNotice />;
}
