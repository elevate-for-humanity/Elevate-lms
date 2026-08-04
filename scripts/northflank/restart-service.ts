#!/usr/bin/env tsx
/**
 * Restart/scale-up a Northflank combined service container.
 *
 * API Bug: POST /services/{serviceId}/restart returns HTTP 200 + {"data":{}}
 * but does NOT start containers when instances=0.
 *
 * The correct endpoint is POST /services/{serviceId}/scale with {"instances":1}.
 * This actually starts the containers and returns HTTP 200.
 *
 * No new build is triggered — uses the currently deployed image.
 *
 * Usage:
 *   pnpm tsx scripts/northflank/restart-service.ts elevate-marketing
 *   pnpm tsx scripts/northflank/restart-service.ts elevate-admin
 *   pnpm tsx scripts/northflank/restart-service.ts elevate-lms
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: tsx restart-service.ts <service-id>');
    console.error('Available: elevate-marketing, elevate-admin, elevate-lms');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  // BUGFIX: POST /services/{serviceId}/restart returns 200 but doesn't start containers.
  // POST /services/{serviceId}/scale with instances=1 is the correct endpoint.
  const scaleEndpoint = projectApiPath(projectId, `/services/${serviceId}/scale`);
  console.info(`POST ${scaleEndpoint} (scale up to 1 instance)`);

  // Try /restart first to do a proper restart if containers are already running.
  // Ignore errors — /restart fails silently when containers are suspended.
  try {
    const restartEndpoint = projectApiPath(projectId, `/services/${serviceId}/restart`);
    await nfFetch(restartEndpoint, { method: 'POST', body: '{}' });
    console.info(`[restart] ${serviceId}: restart OK`);
  } catch {
    console.info(`[restart] ${serviceId}: returned non-200 (suspended — will scale up)`);
  }

  // Scale up to 1 instance — this is what actually starts containers
  // This is the key fix: /scale actually brings containers online when instances=0.
  const result = await nfFetch(scaleEndpoint, {
    method: 'POST',
    body: JSON.stringify({ instances: 1 }),
  });
  console.info(`[restart-ok] ${serviceId}: scaled to 1 instance ✅`);
  console.info(`Scale result:`, result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
