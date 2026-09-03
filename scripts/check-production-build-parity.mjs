/**
 * scripts/check-production-build-parity.mjs
 *
 * Verifies all three production services share the same commit SHA and build ID.
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
        builtAt: health.builtAt ?? 'unknown',
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

const commitShas = new Set(
  results.map((r) => r.commitSha).filter((s) => s !== 'unreachable'),
);
const buildIds = new Set(
  results.map((r) => r.buildId).filter((s) => s !== 'unreachable'),
);
const unreachable = results.filter((r) => r.commitSha === 'unreachable');

if (unreachable.length > 0) {
  console.error(
    `\nPARTIAL: ${unreachable.length} service(s) unreachable — cannot verify parity.`,
  );
  process.exit(1);
}

if (commitShas.has('unknown')) {
  console.error('\nFAIL: At least one deployment reports unknown commit SHA.');
  process.exit(1);
}

if (buildIds.has('unknown')) {
  console.error('\nFAIL: At least one deployment reports unknown build ID.');
  process.exit(1);
}

if (commitShas.size !== 1) {
  console.error(
    `\nFAIL: Production services are deployed from ${commitShas.size} different commits: ${[...commitShas].join(', ')}`,
  );
  process.exit(1);
}

if (buildIds.size !== 1) {
  console.error(
    `\nFAIL: Production services report ${buildIds.size} different build IDs: ${[...buildIds].join(', ')}`,
  );
  process.exit(1);
}

const sha = [...commitShas][0];
const bid = [...buildIds][0];
console.log(`\nPASS: All production services share one commit (${sha}) and build ID (${bid}).`);
