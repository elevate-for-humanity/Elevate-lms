#!/usr/bin/env tsx
/**
 * Restart a Northflank combined service container.
 *
 * After patching service config (health checks, CI/CD, strategy), this script
 * restarts the container using POST /services/{serviceId}/restart.
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

  // Restart endpoint: POST /services/{serviceId}/restart (no payload needed)
  // This restarts the currently deployed container with the latest config
  const endpoint = projectApiPath(projectId, `/services/${serviceId}/restart`);

  console.info(`POST ${endpoint} (restart currently deployed container)`);

  try {
    const result = await nfFetch(endpoint, {
      method: 'POST',
      body: '{}',
    });
    console.info(`[restart-ok] ${serviceId}: restarted`);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error(`[restart-fail] ${serviceId}: ${err}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
