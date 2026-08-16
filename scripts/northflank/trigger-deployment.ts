#!/usr/bin/env tsx
/**
 * Deploy one exact Northflank build without changing the service replica count.
 *
 * The image is built and verified before this script runs. For the one-replica
 * service, recreate is applied only at this deployment step so Northflank does
 * not require capacity for a second full-size replica during cutover.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-deployment.ts <service-id> --build-id <build-id> --sha <sha>
 */

import { combinedServicePatchPath, nfFetch, resolveProjectId } from './lib';

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error(
      'Usage: trigger-deployment.ts <service-id> --build-id <build-id> --sha <sha>',
    );
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('NORTHFLANK_PROJECT_ID is required.');
    process.exit(1);
  }

  const buildId = readArgument('--build-id');
  const sha = readArgument('--sha') ?? process.env.GITHUB_SHA ?? process.env.BUILD_SHA;
  const branch = process.env.DEPLOY_BRANCH ?? 'main';

  if (!buildId) {
    console.error('A concrete Northflank --build-id is required.');
    process.exit(1);
  }
  if (!sha || !/^[a-f0-9]{40}$/i.test(sha)) {
    console.error(`A full 40-character Git SHA is required. Received: ${sha ?? 'missing'}`);
    process.exit(1);
  }

  console.log('=== EXACT SINGLE-REPLICA DEPLOYMENT ===');
  console.log(`Service:  ${serviceId}`);
  console.log(`Build ID: ${buildId}`);
  console.log(`SHA:      ${sha}`);
  console.log(`Branch:   ${branch}`);

  const patchPath = combinedServicePatchPath(projectId, serviceId);
  const deploymentPayload = {
    internal: {
      id: serviceId,
      branch,
      buildSHA: sha,
      buildId,
    },
    docker: { configType: 'default' as const },
    deployment: {
      strategy: { type: 'recreate' as const },
    },
  };

  await nfFetch(patchPath, {
    method: 'PATCH',
    body: JSON.stringify(deploymentPayload),
  });

  console.log('Exact recreate deployment accepted after build verification.');
  console.log('Replica count was preserved; readiness and SHA checks will verify recovery.');
}

main().catch((error) => {
  console.error('Exact deployment failed:', error);
  process.exit(1);
});
