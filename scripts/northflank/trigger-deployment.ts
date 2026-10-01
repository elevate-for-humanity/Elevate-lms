#!/usr/bin/env tsx
/**
 * Deploy one exact Northflank build.
 *
 * The build is created and verified before this script runs. Deployment must use
 * Northflank's deployment endpoint with the concrete verified build ID. The
 * build has already been verified against the requested Git SHA before this
 * script runs. Northflank rejects requests that specify buildId and buildSHA
 * together. A 200 response from that endpoint contains no deployment identity,
 * so the script also requires Northflank's deployment history to acknowledge the
 * exact commit before returning success.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-deployment.ts <service-id> --build-id <build-id> --sha <sha>
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type ServiceDeployment = {
  id: string;
  active?: boolean;
  commit?: { sha?: string };
};

type ServiceDeploymentList = {
  deployments?: ServiceDeployment[];
};

const HANDOFF_TIMEOUT_MS = Number(process.env.NORTHFLANK_HANDOFF_TIMEOUT_MS || 120_000);
const HANDOFF_POLL_MS = Number(process.env.NORTHFLANK_HANDOFF_POLL_MS || 5_000);

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function listDeployments(
  projectId: string,
  serviceId: string,
): Promise<ServiceDeployment[]> {
  const result = await nfFetch<ServiceDeploymentList>(
    projectApiPath(projectId, `/services/${serviceId}/deployments?per_page=20`),
  );
  return Array.isArray(result.deployments) ? result.deployments : [];
}

function shaMatches(actual: string | undefined, expected: string): boolean {
  return actual?.toLowerCase() === expected.toLowerCase();
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
  const deploymentsPath = projectApiPath(
    projectId,
    `/services/${serviceId}/deployments?per_page=20`,
  );
  const deploymentsBefore = await listDeployments(projectId, serviceId);
  const existingDeploymentIds = new Set(deploymentsBefore.map((deployment) => deployment.id));

  // Deploy the exact concrete build that the preceding verification step proved
  // belongs to the requested SHA. Northflank rejects buildId + buildSHA together.
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
  console.log('Waiting for Northflank to acknowledge the exact deployment handoff...');

  const startedAt = Date.now();
  while (Date.now() - startedAt < HANDOFF_TIMEOUT_MS) {
    const deployments = await nfFetch<ServiceDeploymentList>(deploymentsPath);
    const matching = deployments.deployments?.find(
      (deployment) =>
        shaMatches(deployment.commit?.sha, sha) &&
        (deployment.active === true || !existingDeploymentIds.has(deployment.id)),
    );

    if (matching) {
      console.log(
        `Deployment handoff acknowledged: ${matching.id} (${matching.active ? 'active' : 'created'}) for ${sha}.`,
      );
      console.log(`Deployment source locked to verified build ${buildId} for SHA ${sha}.`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, HANDOFF_POLL_MS));
  }

  const latest = await listDeployments(projectId, serviceId);
  const summary = latest
    .slice(0, 5)
    .map(
      (deployment) =>
        `${deployment.id}:${deployment.commit?.sha ?? 'missing-sha'}:${deployment.active ? 'active' : 'inactive'}`,
    )
    .join(', ');
  throw new Error(
    `Northflank accepted the deployment request but did not create or activate SHA ${sha} within ${HANDOFF_TIMEOUT_MS}ms. Latest deployments: ${summary || 'none'}`,
  );
}

main().catch((error) => {
  console.error('Exact deployment failed:', error);
  process.exit(1);
});
