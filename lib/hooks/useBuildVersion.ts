/**
 * lib/hooks/useBuildVersion.ts
 *
 * Prevents Server Action mismatches by tracking build version on client
 * and forcing reload when deployment happens during user session.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

const BUILD_VERSION_KEY = 'elevate_build_version';
const CHECK_INTERVAL_MS = 60_000;
const FAILURE_BACKOFF_MS = 5 * 60_000;

let checkIntervalId: ReturnType<typeof setInterval> | null = null;
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
  const initialized = useRef(false);

  const checkForBuildMismatch = useCallback(async (): Promise<boolean> => {
    const response = await fetchBuildVersion();
    if (!response) return false;

    try {
      const data = await response.json();
      const serverVersion = data.buildVersion ?? data.commit ?? data.gitSha ?? null;
      if (!serverVersion) return false;

      const storedVersion = sessionStorage.getItem(BUILD_VERSION_KEY);

      if (!storedVersion) {
        sessionStorage.setItem(BUILD_VERSION_KEY, serverVersion);
        return false;
      }

      if (storedVersion !== serverVersion) {
        sessionStorage.setItem(BUILD_VERSION_KEY, serverVersion);
        window.location.reload();
        return true;
      }
    } catch {
      // Malformed response; ignore and retry on the next scheduled check.
    }

    return false;
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    void checkForBuildMismatch();
    checkIntervalId = setInterval(() => {
      void checkForBuildMismatch();
    }, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }
    };
  }, [checkForBuildMismatch]);
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
