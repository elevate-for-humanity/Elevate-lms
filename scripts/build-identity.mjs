/**
 * scripts/build-identity.mjs
 *
 * Deterministic build identity for all three Elevate services.
 * Used by next.config.mjs files to set `generateBuildId`.
 *
 * RULES:
 * - Never use Date.now(), Math.random(), or random UUID as build ID
 * - Build ID must be deterministic for a given Git commit
 * - Production builds MUST have a valid SHA (fail-fast if missing)
 */

const ZERO_SHA = /^0+$/;
const VALID_SHA = /^[a-f0-9]{7,40}$/i;

/**
 * Resolve the canonical commit SHA from environment.
 * Priority: GIT_SHA > GITHUB_SHA > NEXT_PUBLIC_GIT_SHA > COMMIT_SHA > SOURCE_COMMIT
 */
export function resolveCommitSha(environment = process.env) {
  const candidate = [
    environment.GIT_SHA,
    environment.GITHUB_SHA,
    environment.NEXT_PUBLIC_GIT_SHA,
    environment.COMMIT_SHA,
    environment.SOURCE_COMMIT,
  ].find(
    (value) =>
      typeof value === 'string' && value.trim().length > 0,
  )?.trim();

  if (!candidate) {
    if (environment.NODE_ENV === 'production') {
      throw new Error(
        '[build-identity] Missing GIT_SHA in production build. ' +
          'Set --build-arg GIT_SHA=<full-sha> in Docker.',
      );
    }
    return 'local-development';
  }

  if (
    candidate === 'unknown' ||
    candidate === 'undefined' ||
    candidate === 'null' ||
    ZERO_SHA.test(candidate)
  ) {
    if (environment.NODE_ENV === 'production') {
      throw new Error(
        `[build-identity] Invalid GIT_SHA in production: "${candidate}"`,
      );
    }
    return 'local-development';
  }

  if (
    environment.NODE_ENV === 'production' &&
    !VALID_SHA.test(candidate)
  ) {
    throw new Error(
      `[build-identity] Malformed GIT_SHA in production: "${candidate}". ` +
        'Expected 7–40 hex characters.',
    );
  }

  return candidate;
}

/**
 * Resolve full build identity (commit SHA, deterministic build ID, timestamp).
 */
export function resolveBuildIdentity(environment = process.env) {
  const commitSha = resolveCommitSha(environment);

  return {
    commitSha,
    buildId: `elevate-${commitSha}`,
    builtAt:
      [
        environment.BUILD_TIMESTAMP,
        environment.NEXT_PUBLIC_BUILD_TIMESTAMP,
      ].find((v) => typeof v === 'string' && v.trim().length > 0) ??
      'unknown',
  };
}
