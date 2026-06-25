/**
 * lib/hooks/useBuildVersion.ts
 * 
 * Prevents Server Action mismatches by tracking build version on client
 * and forcing reload when deployment happens during user session.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

const BUILD_VERSION_KEY = 'elevate_build_version';
const BUILD_TIMESTAMP_KEY = 'elevate_build_timestamp';
const CHECK_INTERVAL_MS = 60_000; // Check every minute

let checkIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Hook to prevent Server Action mismatches after deployment
 * 
 * HOW IT WORKS:
 * 1. On mount, store current build version in sessionStorage
 * 2. Periodically check API for build version changes
 * 3. If mismatch detected → reload page before Server Action fails
 * 
 * Usage:
 * ```tsx
 * // In your root layout or a provider
 * useBuildVersion();
 * ```
 */
export function useBuildVersion() {
  const initialized = useRef(false);

  const checkForBuildMismatch = useCallback(async () => {
    try {
      // Fetch current build version from server
      const response = await fetch('/api/health/build-version', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (!response.ok) return;
      
      const { buildVersion: serverVersion } = await response.json();
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
      // Network error - ignore
    }
    return false;
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initial check on mount
    checkForBuildMismatch();

    // Also check periodically (every minute) to catch long-lived sessions
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
  // If no stored version, can't be stale
  if (!storedVersion) return false;
  
  const currentVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || 
                         process.env.NEXT_PUBLIC_DEPLOYMENT_ID || '';
  
  return storedVersion !== currentVersion;
}

/**
 * Force reload to sync with current build
 */
export function syncWithCurrentBuild(): void {
  if (typeof window === 'undefined') return;
  window.location.reload();
}
