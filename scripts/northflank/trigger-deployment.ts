#!/usr/bin/env tsx
/**
 * Roll out a specific build for a Northflank combined service.
 * 
 * CRITICAL: Uses exact Git SHA for deployment to ensure release integrity.
 * Never uses 'latest' which is mutable and can cause cross-commit drift.
 *
 *   npx tsx scripts/northflank/trigger-deployment.ts elevate-admin
 *   npx tsx scripts/northflank/trigger-deployment.ts elevate-lms
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/northflank/trigger-deployment.ts <service-id>');
    console.error('Uses GITHUB_SHA from environment for immutable deployment');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  // Get exact SHA from environment (set by GitHub Actions)
  const sha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  
  if (!sha) {
    console.error('ERROR: GITHUB_SHA not set. Cannot deploy without exact SHA.');
    console.error('Set GITHUB_SHA environment variable.');
    process.exit(1);
  }

  // Validate SHA format (40 hex characters)
  if (!/^[a-f0-9]{40}$/i.test(sha)) {
    console.error(`ERROR: Invalid SHA format: ${sha}`);
    process.exit(1);
  }

  const branch = process.env.DEPLOY_BRANCH || 'main';

  const payload = {
    internal: {
      id: serviceId,
      branch,
      buildSHA: sha,  // Exact SHA - immutable
    },
    docker: { configType: 'default' as const },
  };

  console.log(`Deploying ${serviceId} with exact SHA: ${sha.slice(0, 12)}...`);

  const result = await nfFetch(projectApiPath(projectId, `/services/${serviceId}/deployment`), {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(
    `Triggered deployment for ${serviceId} (branch=${branch}, buildSHA=${sha.slice(0, 12)})`,
  );
  
  return result;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
