/**
 * UNIFIED VERSION UTILITY
 * 
 * SINGLE SOURCE OF TRUTH for all version/SHA information.
 * Consolidates 5 SHA variables into one canonical resolution.
 * 
 * Priority: GITHUB_SHA → GIT_SHA → NF_GIT_SHA → NEXT_PUBLIC_GIT_SHA → NEXT_PUBLIC_BUILD_VERSION → 'unknown'
 */

let cachedVersion: string | null = null;
let cachedBuildTimestamp: string | null = null;

/**
 * Get canonical Git SHA with unified resolution chain.
 * Only runs once per process (cached).
 */
export function getAppVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  // Unified resolution - GITHUB_SHA is primary (set by CI workflow)
  // NF_GIT_SHA - Northflank injected SHA
  // GIT_SHA - Git integration fallback
  // COMMIT_SHA - Legacy (may be stale from Northflank cache)
  // NEXT_PUBLIC_* - Client accessible fallbacks
  cachedVersion =
    process.env.GITHUB_SHA ||
    process.env.GIT_SHA ||
    process.env.NF_GIT_SHA ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    process.env.NEXT_PUBLIC_BUILD_VERSION ||
    'unknown';

  return cachedVersion;
}

/**
 * Get build timestamp.
 * Only runs once per process (cached).
 */
export function getBuildTimestamp(): string {
  if (cachedBuildTimestamp !== null) {
    return cachedBuildTimestamp;
  }

  cachedBuildTimestamp = process.env.BUILD_TIMESTAMP ?? 'unknown';
  return cachedBuildTimestamp;
}

/**
 * Get canonical SHA (alias for getAppVersion).
 */
export function getCanonicalSha(): string {
  return getAppVersion();
}

/**
 * Get BUILD_ID environment variable.
 */
export function getBuildId(): string {
  return process.env.BUILD_ID || getCanonicalSha();
}

/**
 * Create standardized version info object.
 */
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
