#!/usr/bin/env tsx
/**
 * Point a Northflank combined service at a git branch and optionally trigger a build.
 *
 *   pnpm tsx scripts/northflank/set-service-branch.ts elevate-lms cursor/northflank-setup-c4c6 --build
 */

import { combinedServicePath, nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const serviceId = process.argv[2];
  const branch = process.argv[3];
  const triggerBuild = process.argv.includes('--build');
  if (!serviceId || !branch) {
    console.error(
      'Usage: pnpm tsx scripts/northflank/set-service-branch.ts <service-id> <branch> [--build]',
    );
    process.exit(1);
  }
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  await nfFetch(combinedServicePath(projectId, serviceId), {
    method: 'PATCH',
    body: JSON.stringify({
      vcsData: {
        projectBranch: branch,
      },
    }),
  });
  console.log(`Set ${serviceId} → branch ${branch}`);

  if (triggerBuild) {
    const build = await nfFetch<{ id: string; status?: string; branch?: string }>(
      projectApiPath(projectId, `/services/${serviceId}/build`),
      { method: 'POST', body: JSON.stringify({}) },
    );
    console.log('Triggered build:', build);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
