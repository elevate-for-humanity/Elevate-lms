'use client';

import { useEffect, useRef, useState } from 'react';
import { useBuildVersion } from '@/lib/hooks/useBuildVersion';

/** Shared by every dashboard and the public site, including installed PWAs. */
export function PwaUpdateNotice() {
  const [available, setAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const reloadRequested = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useBuildVersion();

  useEffect(() => {
    const onReady = (event: Event) => {
      registration.current = (event as CustomEvent<ServiceWorkerRegistration>).detail ?? null;
      setAvailable(true);
    };
    const onBuildUpdate = () => setAvailable(true);
    const onControllerChange = () => {
      setAvailable(true);
      if (reloadRequested.current) window.location.reload();
    };
    window.addEventListener('elevate-pwa-update-ready', onReady);
    window.addEventListener('elevate-build-update-ready', onBuildUpdate);
    window.addEventListener('elevate-pwa-controller-changed', onControllerChange);
    return () => {
      window.removeEventListener('elevate-pwa-update-ready', onReady);
      window.removeEventListener('elevate-build-update-ready', onBuildUpdate);
      window.removeEventListener('elevate-pwa-controller-changed', onControllerChange);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!available) return null;

  const update = () => {
    setError('');
    const waiting = registration.current?.waiting;
    if (!waiting || waiting.state === 'activated') {
      window.location.reload();
      return;
    }
    // Wait for the replacement worker to control this page before navigating.
    // An immediate reload can load the old worker again on slower devices.
    reloadRequested.current = true;
    setUpdating(true);
    timer.current = setTimeout(() => {
      reloadRequested.current = false;
      setUpdating(false);
      setError('The update is taking longer than expected. Please try again.');
    }, 15_000);
    try {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      clearTimeout(timer.current);
      reloadRequested.current = false;
      setUpdating(false);
      setError('The update could not start. Please try again.');
    }
  };

  return (
    <section
      data-pwa-update-notice
      aria-label="Application update"
      className="fixed left-4 right-4 z-[80] mx-auto max-w-xl rounded-2xl border border-blue-200 bg-white p-4 shadow-xl"
      style={{
        bottom: 'calc(var(--elevate-pwa-bottom-offset, 1rem) + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div role="status">
        <p className="font-bold text-slate-950">A new Elevate version is available.</p>
        <p className="mt-1 text-sm text-slate-600">
          Save your work, then reload to get the latest updates.
        </p>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
      <button
        type="button"
        onClick={update}
        disabled={updating}
        className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-70"
      >
        {updating ? 'Updating…' : 'Update now'}
      </button>
    </section>
  );
}
