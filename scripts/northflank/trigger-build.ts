#!/usr/bin/env tsx
/**
 * Trigger a Northflank combined-service build from the current git branch.
 *
 *   pnpm tsx scripts/northflank/trigger-build.ts elevate-lms
 *   pnpm tsx scripts/northflank/trigger-build.ts elevate-admin
 */

import fs from 'node:fs';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId) {
    console.error('Usage: pnpm tsx scripts/northflank/trigger-build.ts <service-id>');
    process.exit(1);
  }
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }
  const build = await nfFetch<{
    id: string;
    branch?: string;
    status?: string;
    sha?: string;
    concluded?: boolean;
  }>(projectApiPath(projectId, `/services/${serviceId}/build`), {
    method: 'POST',
    body: JSON.stringify({}),
  });
  console.log(`Triggered build for ${serviceId}:`, build);

  if (process.env.GITHUB_OUTPUT && build.id) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${build.id}\n`, 'utf8');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
