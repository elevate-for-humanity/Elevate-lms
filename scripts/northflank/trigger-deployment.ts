#!/usr/bin/env tsx
/**
 * Deploy one exact Northflank build.
 *
 * The build is created and verified before this script runs. Deployment must use
 * Northflank's deployment endpoint with the concrete verified build ID. The SHA
 * is validated and logged here, but Northflank rejects deployment requests that
 * specify both buildId and buildSHA in the same payload.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-deployment.ts <service-id> --build-id <build-id> --sha <sha>
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

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

  console.log('=== EXACT NORTHFLANK DEPLOYMENT ===');
  console.log(`Service:  ${serviceId}`);
  console.log(`Build ID: ${buildId}`);
  console.log(`Verified SHA: ${sha}`);
  console.log(`Branch:   ${branch}`);

  const deploymentPath = projectApiPath(projectId, `/services/${serviceId}/deployment`);
  const deploymentPayload = {
    internal: {
      id: serviceId,
      branch,
      buildId,
    },
    docker: { configType: 'default' as const },
  };

  await nfFetch(deploymentPath, {
    method: 'POST',
    body: JSON.stringify(deploymentPayload),
  });

  console.log('Exact Northflank deployment request accepted.');
  console.log(`Deployment source locked to verified build ${buildId} for SHA ${sha}.`);
}

main().catch((error) => {
  console.error('Exact deployment failed:', error);
  process.exit(1);
});
