/**
 * UNIFIED VERSION UTILITY
 *
 * SINGLE SOURCE OF TRUTH for all version/SHA information.
 */

import { GENERATED_BUILD_TIMESTAMP } from './generated-build-timestamp';

let cachedVersion: string | null = null;
let cachedBuildTimestamp: string | null = null;

function usable(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized === 'unknown' || normalized === 'undefined' || normalized === 'null') {
    return null;
  }
  return normalized;
}

export function getAppVersion(): string {
  if (cachedVersion) return cachedVersion;

  cachedVersion =
    usable(process.env.GITHUB_SHA) ||
    usable(process.env.GIT_SHA) ||
    usable(process.env.NF_GIT_SHA) ||
    usable(process.env.NEXT_PUBLIC_GIT_SHA) ||
    usable(process.env.NEXT_PUBLIC_BUILD_VERSION) ||
    'unknown';

  return cachedVersion;
}

export function getBuildTimestamp(): string {
  if (cachedBuildTimestamp !== null) return cachedBuildTimestamp;

  cachedBuildTimestamp =
    usable(process.env.BUILD_TIMESTAMP) ||
    usable(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP) ||
    usable(GENERATED_BUILD_TIMESTAMP) ||
    'unknown';

  return cachedBuildTimestamp;
}

export function getCanonicalSha(): string {
  return getAppVersion();
}

export function getBuildId(): string {
  return usable(process.env.BUILD_ID) || usable(process.env.NEXT_PUBLIC_BUILD_ID) || getCanonicalSha();
}

export function getVersionInfo(serviceName: string = 'unknown'): {
  service: string;
  gitSha: string;
  buildId: string;
  buildTimestamp: string;
  environment: string;
  timestamp: string;
} {
  return {
    service: serviceName,
    gitSha: getCanonicalSha(),
    buildId: getBuildId(),
    buildTimestamp: getBuildTimestamp(),
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  };
}
