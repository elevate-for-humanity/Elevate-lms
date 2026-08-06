/**
 * lib/hooks/useBuildVersion.ts
 *
 * Prevents Server Action mismatches by tracking build version on client
 * and forcing reload when deployment happens during user session.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

const BUILD_VERSION_KEY = 'elevate_build_version';
const CHECK_INTERVAL_MS = 60_000; // Check every minute

let checkIntervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Fetch with bounded retries — gives the endpoint a few chances before giving up.
 * Prevents a request storm when the service is returning 503.
 */
async function fetchWithBoundedRetries(
  url: string,
  maxAttempts = 3,
  retryDelayMs = 5000,
): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) return response;
    } catch {
      // network error — retry below
    }
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  return null;
}

/**
 * Hook to prevent Server Action mismatches after deployment
 *
 * HOW IT WORKS:
 * 1. On mount, store current build version in sessionStorage
 * 2. Periodically check API for build version changes
 * 3. If mismatch detected → reload page before Server Action fails
 * 4. Stop polling after MAX_CONSECUTIVE_FAILURES consecutive failures
 *
 * Usage:
 * ```tsx
 * // In your root layout or a provider
 * useBuildVersion();
 * ```
 */
export function useBuildVersion() {
  const initialized = useRef(false);

  const checkForBuildMismatch = useCallback(async (): Promise<boolean> => {
    const response = await fetchWithBoundedRetries('/api/health/build-version');
    if (!response) {
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        // Stop polling — service is unavailable
        if (checkIntervalId) {
          clearInterval(checkIntervalId);
          checkIntervalId = null;
        }
      }
      return false;
    }

    consecutiveFailures = 0; // Reset on success

    try {
      const data = await response.json();
      const serverVersion =
        data.buildVersion ?? data.commit ?? data.gitSha ?? null;
      if (!serverVersion) return false;

      const storedVersion = sessionStorage.getItem(BUILD_VERSION_KEY);

      if (storedVersion && storedVersion !== serverVersion) {
        console.info('[useBuildVersion] Build mismatch detected, reloading...', {
          stored: storedVersion,
          current: serverVersion,
        });

        sessionStorage.setItem(BUILD_VERSION_KEY, serverVersion);
        window.location.reload();
        return true; // Will reload
      }
    } catch {
      // Malformed JSON — ignore
    }
    return false;
  }, []);

  useEffect((): void => {
    if (initialized.current) return;
    initialized.current = true;

    const storedVersion = sessionStorage.getItem(BUILD_VERSION_KEY);

    checkForBuildMismatch().then((reloaded) => {
      if (!reloaded && !storedVersion) {
        fetchWithBoundedRetries('/api/health/build-version', 2, 2000)
          .then(r => r?.json())
          .then((data) => {
            const version =
              data?.buildVersion ?? data?.commit ?? data?.gitSha ?? null;
            if (version) sessionStorage.setItem(BUILD_VERSION_KEY, version);
          })
          .catch(() => {});
      }
    });

    checkIntervalId = setInterval(checkForBuildMismatch, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }
    };
  }, [checkForBuildMismatch]);
}

/**
 * Check if current page is from a stale build
 */
export function isStaleBuild(): boolean {
  if (typeof window === 'undefined') return false;

  const storedVersion = sessionStorage.getItem(BUILD_VERSION_KEY);
  if (!storedVersion) return false;

  const currentVersion =
    process.env.NEXT_PUBLIC_BUILD_VERSION ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ID ||
    '';

  return storedVersion !== currentVersion;
}

/**
 * Force reload to sync with current build
 */
export function syncWithCurrentBuild(): void {
  if (typeof window === 'undefined') return;
  window.location.reload();
}
