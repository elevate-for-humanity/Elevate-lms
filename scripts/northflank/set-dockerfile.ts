#!/usr/bin/env tsx
/**
 * Set the Dockerfile path for a Northflank service.
 *
 * Usage:
 *   npx tsx scripts/northflank/set-dockerfile.ts elevate-marketing /Dockerfile.marketing
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const serviceId = process.argv[2];
  const dockerfilePath = process.argv[3];

  if (!serviceId || !dockerfilePath) {
    console.error(
      'Usage: npx tsx scripts/northflank/set-dockerfile.ts <service-id> <dockerfile-path>',
    );
    console.error('Example: npx tsx scripts/northflank/set-dockerfile.ts elevate-marketing /Dockerfile.marketing');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const path = projectApiPath(projectId, `/services/${serviceId}/build-configuration`);
  
  console.log(`Setting ${serviceId} Dockerfile to ${dockerfilePath}...`);

  await nfFetch(path, {
    method: 'PATCH',
    body: JSON.stringify({
      dockerfilePath: dockerfilePath,
    }),
  });

  console.log(`✅ ${serviceId} now uses Dockerfile: ${dockerfilePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
