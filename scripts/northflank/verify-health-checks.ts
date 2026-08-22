#!/usr/bin/env tsx
/**
 * Verify canonical Northflank runtime configuration for one service or --all.
 *
 * Checks the actual service object after configure-services.ts applies:
 * - public internal port = 3000
 * - runtime PORT = 3000
 * - startup probe = /api/ping:3000
 * - readiness probe = /api/ready:3000
 * - reports current public-host status without blocking a recovery deployment
 */

import { execFileSync } from 'node:child_process';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';
import { resolveTargetServiceIds, serviceIdForRole } from './service-targets';

const RUNTIME_PORT = 3000;

const PUBLIC_SMOKE_BY_SERVICE: Record<string, string> = {
  [serviceIdForRole('marketing')]: 'https://www.elevateforhumanity.org/api/ping',
  [serviceIdForRole('lms')]: 'https://app.elevateforhumanity.org/api/ping',
  [serviceIdForRole('admin')]: 'https://admin.elevateforhumanity.org/api/ping',
};

function readRuntimePort(service: any): string | undefined {
  const env = service?.runtimeEnvironment;
  if (!env) return undefined;
  if (Array.isArray(env)) {
    return env.find((row: any) => row?.key === 'PORT' || row?.name === 'PORT')?.value;
  }
  return env.PORT;
}

function hasProbe(service: any, type: string, path: string): boolean {
  const probes = Array.isArray(service?.healthChecks) ? service.healthChecks : [];
  return probes.some(
    (probe: any) =>
      probe?.type === type && probe?.path === path && Number(probe?.port) === RUNTIME_PORT,
  );
}

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

  let ok = true;
  const targets = resolveTargetServiceIds();

  for (const serviceId of targets) {
    console.log(`\n=== ${serviceId} ===`);

    execFileSync(
      'npx',
      ['tsx', 'scripts/northflank/configure-services.ts', serviceId, '--execute'],
      { stdio: 'inherit', cwd: process.cwd() },
    );

    const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
    const service = response?.data ?? response;

    const sitePort = (service?.ports ?? []).find((p: any) => p?.name === 'site') ?? service?.ports?.[0];
    const internalPort = Number(sitePort?.internalPort);
    const runtimePort = readRuntimePort(service);
    const startupOk = hasProbe(service, 'startupProbe', '/api/ping');
    const readinessOk = hasProbe(service, 'readinessProbe', '/api/ready');

    console.log(`  internalPort=${internalPort || 'missing'}`);
    console.log(`  runtime PORT=${runtimePort ?? 'missing'}`);
    console.log(`  startup /api/ping:3000=${startupOk}`);
    console.log(`  readiness /api/ready:3000=${readinessOk}`);

    if (internalPort !== RUNTIME_PORT || runtimePort !== String(RUNTIME_PORT) || !startupOk || !readinessOk) {
      ok = false;
      console.error('  Canonical Northflank runtime configuration mismatch.');
    }

    const smokeUrl = PUBLIC_SMOKE_BY_SERVICE[serviceId];
    if (!smokeUrl) {
      ok = false;
      console.error(`  No public smoke mapping for ${serviceId}`);
      continue;
    }

    try {
      const res = await fetch(smokeUrl, { signal: AbortSignal.timeout(15_000) });
      console.log(`  ${smokeUrl} -> HTTP ${res.status}`);
      if (!res.ok) {
        console.warn('  Public service is not healthy before deployment; continuing recovery.');
      }
    } catch (error) {
      console.warn(`  ${smokeUrl} -> unavailable before deployment; continuing recovery`, error);
    }
  }

  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
