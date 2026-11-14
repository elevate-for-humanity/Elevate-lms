import { productionBuildParity } from './production-build-parity-policy.mjs';
/**
 * scripts/check-production-build-parity.mjs
 *
 * Verifies all three production services share the same commit SHA with valid per-service build IDs.
 * Fails if services are deployed from different commits.
 *
 * Usage:
 *   node scripts/check-production-build-parity.mjs
 *
 * Environment:
 *   MARKETING_URL  — defaults to https://www.elevateforhumanity.org
 *   ADMIN_URL      — defaults to https://admin.elevateforhumanity.org
 *   LMS_URL        — defaults to https://app.elevateforhumanity.org
 *   SKIP_PARITY    — set to skip (useful in CI for feature branches)
 */

const services = [
  {
    name: 'marketing',
    url: process.env.MARKETING_URL ?? 'https://www.elevateforhumanity.org',
  },
  {
    name: 'admin',
    url: process.env.ADMIN_URL ?? 'https://admin.elevateforhumanity.org',
  },
  {
    name: 'lms',
    url: process.env.LMS_URL ?? 'https://app.elevateforhumanity.org',
  },
];

const results = [];

for (const service of services) {
  try {
    const response = await fetch(`${service.url}/api/version`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Fall back to /api/health for older deployments
      const healthResponse = await fetch(`${service.url}/api/health`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!healthResponse.ok) {
        throw new Error(
          `Health check returned ${healthResponse.status}`,
        );
      }

      const health = await healthResponse.json();
      results.push({
        name: service.name,
        commitSha: health.commit ?? 'unknown',
        buildId: health.buildId ?? 'unknown',
        builtAt: health.builtAt ?? health.buildTime ?? 'unknown',
        source: 'health',
      });
    } else {
      const body = await response.json();
      results.push({
        name: service.name,
        commitSha: body.commitSha ?? body.commit ?? 'unknown',
        buildId: body.buildId ?? 'unknown',
        builtAt: body.builtAt ?? 'unknown',
        source: 'version',
      });
    }
  } catch (err) {
    console.error(`Failed to fetch version from ${service.name} (${service.url}): ${err.message}`);
    results.push({
      name: service.name,
      commitSha: 'unreachable',
      buildId: 'unreachable',
      builtAt: 'unreachable',
      error: err.message,
    });
  }
}

console.log('\n=== PRODUCTION BUILD PARITY REPORT ===\n');
console.table(
  results.map(({ name, commitSha, buildId, builtAt, error }) => ({
    service: name,
    commitSha: error ? `ERROR: ${error}` : commitSha,
    buildId,
    builtAt,
  })),
);

const parity = productionBuildParity(results);
console.log(`\n${parity.ok ? 'PASS' : 'FAIL'}: ${parity.message}`);
process.exitCode = parity.ok ? 0 : 1;
