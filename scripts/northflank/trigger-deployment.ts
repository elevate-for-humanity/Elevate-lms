#!/usr/bin/env tsx
/**
 * Roll out the latest successful build for a Northflank combined service.
 *
 * Use when builds succeed but deployedSHA is stale (e.g. disabledCD was true).
 *
 *   pnpm tsx scripts/northflank/trigger-deployment.ts elevate-admin
 *   pnpm tsx scripts/northflank/trigger-deployment.ts elevate-admin --sha 9291b43c...
 *   pnpm tsx scripts/northflank/trigger-deployment.ts elevate-lms --sha $(git rev-parse HEAD)
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: pnpm tsx scripts/northflank/trigger-deployment.ts <service-id> [--sha <commit>]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const sha = argValue('--sha');
  const branch = process.env.DEPLOY_BRANCH || 'main';

  const payload: Record<string, unknown> = {
    internal: {
      id: serviceId,
      branch,
    },
    docker: { configType: 'default' as const },
  };

  // Use specific SHA, or fallback to latest
  if (sha) {
    (payload.internal as Record<string, unknown>).buildSHA = sha;
    console.log(`Deploying build for SHA: ${sha.slice(0, 12)}...`);
  } else {
    (payload.internal as Record<string, unknown>).buildSHA = 'latest';
    console.log('Deploying latest build');
  }

  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/deployment`), {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(
    `Triggered deployment for ${serviceId} (branch=${branch}, buildSHA=${sha ?? 'latest'})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
