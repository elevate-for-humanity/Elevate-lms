/**
 * lib/hooks/useBuildVersion.ts
 *
 * Prevents Server Action mismatches by tracking build version on client
 * and offering a safe refresh when deployment happens during a user session.
 */

'use client';

import { useEffect } from 'react';

const BUILD_VERSION_KEY = 'elevate_build_version';
const CHECK_INTERVAL_MS = 60_000;
const FAILURE_BACKOFF_MS = 5 * 60_000;

let backoffUntil = 0;

async function fetchBuildVersion(): Promise<Response | null> {
  if (Date.now() < backoffUntil) return null;

  try {
    const response = await fetch('/api/health/build-version', {
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (response.status === 503) {
      backoffUntil = Date.now() + FAILURE_BACKOFF_MS;
      return null;
    }

    if (!response.ok) return null;
    backoffUntil = 0;
    return response;
  } catch {
    backoffUntil = Date.now() + FAILURE_BACKOFF_MS;
    return null;
  }
}

export function useBuildVersion() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    let cancelled = false;
    let checking = false;
    // Compare the loaded JavaScript with the server, not just two server polls.
    // Otherwise a stale installed app can adopt the new SHA on its first poll.
    let loadedVersion = process.env.NEXT_PUBLIC_GIT_SHA ||
      process.env.NEXT_PUBLIC_BUILD_VERSION || process.env.NEXT_PUBLIC_DEPLOYMENT_ID || '';
    if (!loadedVersion || loadedVersion === 'unknown') {
      try { loadedVersion = sessionStorage.getItem(BUILD_VERSION_KEY) || ''; }
      catch { loadedVersion = ''; }
    }

    const check = async () => {
      if (cancelled || checking) return;
      checking = true;
      try {
        const response = await fetchBuildVersion();
        if (!response || cancelled) return;
        const data = await response.json();
        const serverVersion = data.commit ?? data.gitSha ?? data.buildVersion;
        if (cancelled || typeof serverVersion !== 'string' || !serverVersion || serverVersion === 'unknown') return;
        if (!loadedVersion) loadedVersion = serverVersion;
        if (loadedVersion !== serverVersion) {
          // Never discard an unsaved form or Studio conversation automatically.
          window.dispatchEvent(new CustomEvent('elevate-build-update-ready'));
        } else {
          try { sessionStorage.setItem(BUILD_VERSION_KEY, loadedVersion); } catch { /* Storage is optional. */ }
        }
      } catch {
        // Ignore malformed responses and retry on the next scheduled check.
      } finally {
        checking = false;
      }
    };

    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    const onOnline = () => { void check(); };
    void check();
    const interval = setInterval(() => { void check(); }, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, []);
}

export function isStaleBuild(): boolean {
  if (typeof window === 'undefined') return false;

  const storedVersion = sessionStorage.getItem(BUILD_VERSION_KEY);
  if (!storedVersion) return false;

  const currentVersion =
    process.env.NEXT_PUBLIC_BUILD_VERSION ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ID ||
    '';

  return Boolean(currentVersion) && storedVersion !== currentVersion;
}

export function syncWithCurrentBuild(): void {
  if (typeof window === 'undefined') return;
  window.location.reload();
}
