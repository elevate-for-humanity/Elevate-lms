#!/usr/bin/env tsx
/**
 * Deploy an exact build for a Northflank combined service.
 *
 * Uses exact Git SHA and Build ID to ensure release integrity -- never uses 'latest'.
 * Explicitly selects the image produced by the completed build rather than merely
 * restarting an existing pod.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-deployment.ts <service-id> --build-id <build-id> --sha <sha>
 *
 * API endpoint:
 *   PATCH /services/combined/{id}  -- update deployment config with exact build ID and SHA
 */

import { nfFetch, combinedServicePatchPath, projectApiPath, resolveProjectId } from './lib';

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
    console.error(
      'A Northflank build ID is required. Refusing to deploy an unspecified image.',
    );
    process.exit(1);
  }

  if (!sha || !/^[a-f0-9]{40}$/i.test(sha)) {
    console.error(
      `A valid 40-character Git SHA is required. Received: ${sha ?? 'missing'}`,
    );
    process.exit(1);
  }

  console.log('=== EXACT BUILD DEPLOYMENT ===');
  console.log(`Service:  ${serviceId}`);
  console.log(`Build ID: ${buildId}`);
  console.log(`SHA:      ${sha}`);
  console.log(`Branch:   ${branch}`);

  /*
   * Combined services require deployment settings inside the
   * `deployment` object. This explicitly selects the image produced
   * by the completed build rather than merely restarting an existing pod.
   */
  const payload = {
    deployment: {
      instances: 1,
      internal: {
        id: serviceId,
        branch,
        buildSHA: sha,
        buildId,
      },
      docker: {
        configType: 'default' as const,
      },
    },
  };

  const endpoint = combinedServicePatchPath(projectId, serviceId);

  console.log(`Deploying exact build through ${endpoint}`);
  await nfFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  /*
   * Read the service back and verify that Northflank recorded
   * the requested deployment SHA and build ID.
   */
  const service = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));

  const deployedSha =
    service?.deployment?.internal?.buildSHA ??
    service?.data?.deployment?.internal?.buildSHA;
  const deployedBuildId =
    service?.deployment?.internal?.buildId ??
    service?.data?.deployment?.internal?.buildId;

  console.log(`Northflank deployment SHA: ${deployedSha ?? 'unavailable'}`);
  console.log(`Northflank deployment build ID: ${deployedBuildId ?? 'unavailable'}`);

  if (deployedSha && deployedSha !== sha) {
    throw new Error(
      `Deployment SHA mismatch. Expected ${sha}, Northflank recorded ${deployedSha}`,
    );
  }

  if (deployedBuildId && deployedBuildId !== buildId) {
    throw new Error(
      `Deployment build ID mismatch. Expected ${buildId}, Northflank recorded ${deployedBuildId}`,
    );
  }

  console.log(`✅ Exact Marketing build ${buildId} selected for deployment.`);
}

main().catch((error) => {
  console.error('❌ Exact deployment failed:', error);
  process.exit(1);
});
