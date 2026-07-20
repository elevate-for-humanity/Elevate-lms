#!/usr/bin/env tsx
/**
 * Trigger a Northflank combined-service build from the current git branch.
 * Skips build if the same SHA is already building or recently completed.
 *
 *   npx tsx scripts/northflank/trigger-build.ts elevate-lms
 *   npx tsx scripts/northflank/trigger-build.ts elevate-admin
 */

import fs from 'node:fs';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function getRecentBuilds(projectId: string, serviceId: string, sha: string) {
  try {
    const builds = await nfFetch<{
      builds: Array<{
        id: string;
        sha?: string;
        status?: string;
        concluded?: boolean;
      }>;
    }>(projectApiPath(projectId, `/services/${serviceId}/builds?limit=5`));
    return builds.builds || [];
  } catch {
    return [];
  }
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId) {
    console.error('Usage: npx tsx scripts/northflank/trigger-build.ts <service-id>');
    process.exit(1);
  }
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  // Get current SHA and pass as build argument
  const currentSha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || '';

  // Check for existing build with same SHA
  if (currentSha) {
    const recentBuilds = await getRecentBuilds(projectId, serviceId, currentSha);
    const existingBuild = recentBuilds.find(
      (b) => b.sha === currentSha && (!b.concluded || b.status === 'running' || b.status === 'pending')
    );
    
    if (existingBuild) {
      console.log(`Skipping build for ${serviceId} - SHA ${currentSha} already has build ${existingBuild.id} (status: ${existingBuild.status})`);
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${existingBuild.id}\n`, 'utf8');
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `skipped=true\n`, 'utf8');
      }
      return;
    }
  }

  // Get the current branch to build from
  const currentBranch = process.env.DEPLOY_BRANCH || 'main';
  
  // Trigger build from the current branch
  // Pass GIT_SHA as the authoritative release identity
  const build = await nfFetch<{
    id: string;
    branch?: string;
    status?: string;
    sha?: string;
    concluded?: boolean;
  }>(projectApiPath(projectId, `/services/${serviceId}/build`), {
    method: 'POST',
    body: JSON.stringify({
      branch: currentBranch,
      buildArgs: {
        GIT_SHA: currentSha || 'unknown',
        NEXT_PUBLIC_GIT_SHA: currentSha || 'unknown',
        BUILD_TIMESTAMP: new Date().toISOString(),
      },
    }),
  });
  console.log(`Triggered build for ${serviceId}:`, build);

  if (process.env.GITHUB_OUTPUT && build.id) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${build.id}\n`, 'utf8');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
