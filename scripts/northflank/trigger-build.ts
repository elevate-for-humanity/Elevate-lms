#!/usr/bin/env tsx
/**
 * Trigger exactly one Northflank build for a combined service.
 *
 * Service configuration and build arguments are applied separately by
 * configure-services.ts. This script intentionally does not PATCH the combined
 * service because that PATCH can start an additional build.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-build.ts <service-id>
 */

import fs from 'node:fs';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

interface NorthflankBuildResponse {
  id: string;
  status: string;
  sha?: string;
  concluded?: boolean;
  createdAt?: string;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId) {
    console.error('Usage: npx tsx scripts/northflank/trigger-build.ts <service-id>');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const currentSha = process.env.GITHUB_SHA || process.env.BUILD_SHA || '';
  if (!/^[a-f0-9]{40}$/i.test(currentSha)) {
    console.error(
      `Northflank POST /build requires a full 40-character Git SHA. Received: ${currentSha || 'missing'}`,
    );
    process.exit(1);
  }

  const buildPath = projectApiPath(projectId, `/services/${serviceId}/build`);
  console.log('=== SINGLE BUILD TRIGGER ===');
  console.log(`Service: ${serviceId}`);
  console.log(`SHA:     ${currentSha}`);

  const build = await nfFetch<NorthflankBuildResponse>(buildPath, {
    method: 'POST',
    body: JSON.stringify({
      sha: currentSha,
      no_cache: process.env.FORCE_FRESH_BUILD === 'true',
    }),
  });

  if (!build.id) {
    throw new Error(`Northflank build response did not include an id: ${JSON.stringify(build)}`);
  }

  console.log(`Build triggered once: ${build.id}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${build.id}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error('Build trigger failed:', error);
  process.exit(1);
});
