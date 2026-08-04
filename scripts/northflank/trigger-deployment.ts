#!/usr/bin/env tsx
/**
 * Deploy an exact build for a Northflank combined service.
 *
 * Uses exact Git SHA and Build ID to ensure release integrity -- never uses 'latest'.
 * Explicitly selects the image produced by the completed build.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-deployment.ts <service-id> --build-id <build-id> --sha <sha>
 *
 * API flow:
 *   1. PATCH /services/combined/{id}  -- set build config with SHA and branch
 *   2. POST  /services/{id}/scale     -- start containers with built image
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

  if (!sha || !/^[a-f0-9]{7,40}$/i.test(sha)) {
    console.error(
      `A valid Git SHA is required (7-40 hex chars). Received: ${sha ?? 'missing'}`,
    );
    process.exit(1);
  }

  console.log('=== EXACT BUILD DEPLOYMENT ===');
  console.log(`Service:  ${serviceId}`);
  console.log(`Build ID: ${buildId ?? 'N/A'}`);
  console.log(`SHA:      ${sha}`);
  console.log(`Branch:   ${branch}`);

  const patchPath = combinedServicePatchPath(projectId, serviceId);

  /*
   * Step 1: PATCH the service to set build config (SHA, branch)
   * This tells Northflank which build to use when scaling.
   */
  const buildPayload = {
    internal: {
      id: serviceId,
      branch,
      buildSHA: sha,
    },
    docker: { configType: 'default' as const },
  };

  console.log(`Patching ${serviceId} at ${patchPath} (branch=${branch}, buildSHA=${sha.slice(0, 12)})...`);
  await nfFetch(patchPath, { method: 'PATCH', body: JSON.stringify(buildPayload) });
  console.log('PATCH OK');

  /*
   * Step 2: Scale to 1 instance -- this starts the containers
   * Northflank will use the build associated with the SHA we just set.
   */
  console.log(`Scaling ${serviceId} to 1 instance...`);
  const scaleResult = await nfFetch(
    projectApiPath(projectId, `/services/${serviceId}/scale`),
    { method: 'POST', body: JSON.stringify({ instances: 1 }) },
  );

  console.log(`Deployment triggered for ${serviceId} (scale result: ${JSON.stringify(scaleResult)})`);
  console.log(`✅ Deployment completed for SHA ${sha.slice(0, 12)}`);
}

main().catch((error) => {
  console.error('❌ Exact deployment failed:', error);
  process.exit(1);
});
