#!/usr/bin/env tsx
/**
 * Verify Northflank HTTP health probes for one service (or --all).
 *
 *   npx tsx scripts/northflank/verify-health-checks.ts elevate-admin
 *   npx tsx scripts/northflank/verify-health-checks.ts --all
 */

import { execSync } from 'node:child_process';
import { resolveTargetServiceIds, serviceIdForRole } from './service-targets';

// Northflank services use /api/version as the health probe path (not /api/ping).
// Both endpoints are available in the running container; /api/version is
// the canonical probe endpoint because it is always present and returns 200
// without requiring authentication.
const EXPECTED_HEALTH_SNIPPET = 'startupProbe:/api/version:8080, readinessProbe:/api/version:8080';

const PUBLIC_SMOKE_BY_SERVICE: Record<string, string> = {
  [serviceIdForRole('lms')]: 'https://www.elevateforhumanity.org/api/ping',
  [serviceIdForRole('admin')]: 'https://admin.elevateforhumanity.org/api/ping',
};

async function main() {
  let ok = true;
  const targets = resolveTargetServiceIds();

  for (const serviceId of targets) {
    console.log(`\n=== ${serviceId} ===`);
    console.log('Applying health probe config for this service only...\n');
    const out = execSync(
      `npx tsx scripts/northflank/configure-services.ts ${serviceId} --execute`,
      { encoding: 'utf8', cwd: process.cwd() },
    );
    console.log(out);

    const line = out
      .split('\n')
      .find((l) => l.includes(`[patch-ok] ${serviceId}`) && l.includes('health=['));
    if (!line?.includes(EXPECTED_HEALTH_SNIPPET)) {
      console.error(`  Expected health=[${EXPECTED_HEALTH_SNIPPET}] in patch response`);
      console.error(`  Got: ${line ?? '(no patch-ok line)'}`);
      ok = false;
    } else {
      console.log(`  Northflank probes: ${EXPECTED_HEALTH_SNIPPET}`);
    }

    const smokeUrl = PUBLIC_SMOKE_BY_SERVICE[serviceId];
    if (smokeUrl) {
      console.log(`\nPublic smoke: ${smokeUrl}`);
      try {
        const res = await fetch(smokeUrl, { signal: AbortSignal.timeout(15_000) });
        console.log(`  → HTTP ${res.status}`);
        if (!res.ok) ok = false;
      } catch (e) {
        console.error(`  → failed:`, e);
        ok = false;
      }
    }
  }

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
