#!/usr/bin/env tsx
/**
 * Trigger a new deployment for a Northflank combined service.
 *
 * Uses exact Git SHA to ensure release integrity -- never uses 'latest'.
 *
 * API endpoints:
 *   PATCH /services/combined/{id}  -- update build config (GIT_SHA, etc.)
 *   POST  /services/{id}/scale     -- start containers with built image
 *
 *   npx tsx scripts/northflank/trigger-deployment.ts elevate-admin
 *   npx tsx scripts/northflank/trigger-deployment.ts elevate-lms
 */

import { nfFetch, combinedServicePatchPath, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/northflank/trigger-deployment.ts <service-id>');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const sha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  if (!sha) {
    console.error('ERROR: GITHUB_SHA not set. Cannot deploy without exact SHA.');
    process.exit(1);
  }

  if (!/^[a-f0-9]{40}$/i.test(sha)) {
    console.error(`ERROR: Invalid SHA format: ${sha}`);
    process.exit(1);
  }

  const branch = process.env.DEPLOY_BRANCH || 'main';

  // Step 1: PATCH the service to set build config (GIT_SHA, branch)
  // Combined services use /services/combined/{id}, not /services/{id}
  const patchPath = combinedServicePatchPath(projectId, serviceId);
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
  console.log(`PATCH OK`);

  // Step 2: Scale to 1 instance -- this actually starts the containers
  const scaleResult = await nfFetch(
    projectApiPath(projectId, `/services/${serviceId}/scale`),
    { method: 'POST', body: JSON.stringify({ instances: 1 }) },
  );

  console.log(`Deployment triggered for ${serviceId} (scale result: ${JSON.stringify(scaleResult)})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
