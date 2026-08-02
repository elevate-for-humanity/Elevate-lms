#!/usr/bin/env tsx
/**
 * Restart a Northflank combined service (redeploy currently deployed image).
 *
 * After patching service config (health checks, CI/CD, strategy), this script
 * triggers a clean restart using the currently deployed image (no new build).
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

  // Use combined service endpoint - redeploys the currently deployed image
  const endpoint = projectApiPath(projectId, `/services/combined/${serviceId}/deployment`);

  // Trigger restart - Northflank redeploys the current image (no new build needed)
  const payload = {
    docker: { configType: 'default' },
  };

  console.info(`POST ${endpoint}`);
  console.info(`Payload: ${JSON.stringify(payload)}`);

  try {
    const result = await nfFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.info(`[restart-ok] ${serviceId}:`, JSON.stringify(result).slice(0, 300));
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
