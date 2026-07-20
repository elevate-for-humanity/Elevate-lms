// Canonical resolution chain for build identity
// IMPORTANT: GITHUB_SHA is the primary source (set by CI workflow)
// GIT_SHA and NEXT_PUBLIC_GIT_SHA are fallbacks
// COMMIT_SHA is NOT used as primary - Northflank may cache stale values
const gitSha =
  process.env.GITHUB_SHA ??
  process.env.GIT_SHA ??
  process.env.NEXT_PUBLIC_GIT_SHA ??
  process.env.NEXT_PUBLIC_BUILD_VERSION ??
  'unknown';

let cachedVersion: string | null = null;

export function getAppVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  // Use environment variable (set during Docker build) - fallback to unknown
  cachedVersion = gitSha;

  return cachedVersion;
}

export function getBuildTimestamp(): string {
  return process.env.BUILD_TIMESTAMP ?? 'unknown';
}
