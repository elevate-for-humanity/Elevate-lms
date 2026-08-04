#!/usr/bin/env tsx
/**
 * Trigger a new deployment for a Northflank combined service.
 *
 * Uses exact Git SHA to ensure release integrity — never uses 'latest'.
 *
 * API Bug: /services/{id}/deployment (POST) returns 404 for combined services.
 * The correct endpoint is /services/{id}/scale (POST) which actually starts
 * the containers with the newly built image.
 *
 *   npx tsx scripts/northflank/trigger-deployment.ts elevate-admin
 *   npx tsx scripts/northflank/trigger-deployment.ts elevate-lms
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

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

  // BUGFIX: /services/{id}/deployment returns 404 for combined services.
  // /services/{id}/scale (POST) is the correct endpoint — it actually starts
  // containers with the newly built image and returns HTTP 200.
  const path = projectApiPath(projectId, `/services/${serviceId}`);

  console.log(`Triggering deployment for ${serviceId} (branch=${branch}, buildSHA=${sha.slice(0, 12)})...`);

  // Step 1: Tell Northflank which SHA to deploy
  const buildPayload = {
    internal: {
      id: serviceId,
      branch,
      buildSHA: sha,
    },
    docker: { configType: 'default' as const },
  };
  await nfFetch(path, { method: 'PATCH', body: JSON.stringify(buildPayload) });

  // Step 2: Scale up to 1 instance — this is what actually starts the containers
  // /restart returns {"data":{}} but doesn't start containers.
  // /scale returns HTTP 200 and DOES start the containers.
  const scaleResult = await nfFetch(
    projectApiPath(projectId, `/services/${serviceId}/scale`),
    { method: 'POST', body: JSON.stringify({ instances: 1 }) },
  );

  console.log(`Deployment triggered for ${serviceId} ✅`);
  console.log(`Scale result:`, scaleResult);

  return scaleResult;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
