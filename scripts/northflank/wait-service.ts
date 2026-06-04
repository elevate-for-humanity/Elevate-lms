#!/usr/bin/env tsx
/**
 * Wait for a Northflank service deployment/build to settle.
 *
 * Usage:
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-admin
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-lms --timeout-ms 1200000
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type ServiceStatus = {
  deploymentStatus?: { status?: string };
  buildStatus?: string;
  status?: {
    build?: { status?: string };
    deployment?: { status?: string; reason?: string };
  };
};

function resolveServicePhase(service: ServiceStatus): string {
  const build = service.status?.build?.status ?? service.buildStatus;
  const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;

  if (build && !['SUCCESS', 'COMPLETED'].includes(build)) {
    return build;
  }
  if (deploy) return deploy;
  return build ?? deploy ?? 'unknown';
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: pnpm tsx scripts/northflank/wait-service.ts <service-id> [--timeout-ms 900000]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const timeoutMs = Number(argValue('--timeout-ms') || 900_000);
  const start = Date.now();
  let last = '';

  while (Date.now() - start < timeoutMs) {
    const service = await nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`));
    const build = service.status?.build?.status ?? service.buildStatus;
    const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;
    const phase = resolveServicePhase(service);
    const label =
      build && deploy && build !== deploy ? `${build} (deploy: ${deploy})` : phase;

    if (label !== last) {
      console.log(`${serviceId}: ${label}`);
      last = label;
    }

    if (build === 'FAILURE' || build === 'ERROR' || build === 'FAILED') {
      console.error(`${serviceId} build failed (${build})`);
      process.exit(1);
    }

    const deployReady =
      deploy && ['COMPLETED', 'RUNNING', 'SUCCESS'].includes(deploy);
    const buildDone =
      !build || ['SUCCESS', 'COMPLETED', 'SKIPPED'].includes(build);

    if (buildDone && deployReady) {
      return;
    }

    if (['FAILED', 'ERROR'].includes(deploy ?? '')) {
      console.error(`${serviceId} deployment failed (${deploy})`);
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  console.error(`${serviceId} did not settle within ${timeoutMs}ms`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
