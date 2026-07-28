#!/usr/bin/env tsx
/**
 * Trigger a Northflank combined-service build from the current git branch.
 * Skips build if the same SHA is already building or recently completed.
 *
 * CRITICAL: PATCHes the service configuration with GIT_SHA while preserving
 * existing buildArguments (like NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * that were set by configure-services.ts.
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

/** Fetch existing buildArguments from Northflank to preserve them. */
async function getExistingBuildArguments(
  projectId: string,
  serviceId: string,
): Promise<Record<string, string>> {
  try {
    const service = await nfFetch<{ buildArguments?: Record<string, string> }>(
      projectApiPath(projectId, `/services/combined/${serviceId}`),
    );
    return service.buildArguments ?? {};
  } catch {
    return {};
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
  const currentSha =
    process.env.GITHUB_SHA ||
    process.env.BUILD_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    '';

  // Check for existing build with same SHA
  if (currentSha) {
    const recentBuilds = await getRecentBuilds(projectId, serviceId, currentSha);
    const existingBuild = recentBuilds.find(
      (b) =>
        b.sha === currentSha &&
        (!b.concluded || b.status === 'running' || b.status === 'pending'),
    );

    if (existingBuild) {
      console.log(
        `Skipping build for ${serviceId} - SHA ${currentSha} already has build ${existingBuild.id} (status: ${existingBuild.status})`,
      );
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${existingBuild.id}\n`, 'utf8');
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `skipped=true\n`, 'utf8');
      }
      return;
    }
  }

  console.log('=== TRIGGER BUILD ===');
  console.log('Service:', serviceId);
  console.log('currentSha:', currentSha);

  // CRITICAL FIX: Fetch existing buildArguments (Supabase URL, anon key, etc.)
  // and MERGE with git-related arguments. This prevents overwriting the
  // Supabase build arguments that configure-services.ts set.
  const existingArgs = await getExistingBuildArguments(projectId, serviceId);
  console.log('Existing buildArguments:', Object.keys(existingArgs));

  // Merge: keep existing args (Supabase, etc.) + add/update git args
  const mergedBuildArguments: Record<string, string> = {
    ...existingArgs,
    GITHUB_SHA: currentSha,
    GIT_SHA: currentSha,
    NEXT_PUBLIC_GIT_SHA: currentSha,
    BUILD_TIMESTAMP: new Date().toISOString(),
    FALLBACK_COMMIT: currentSha,
  };

  console.log('Merged buildArguments:', Object.keys(mergedBuildArguments));

  const buildArgsPayload = { buildArguments: mergedBuildArguments };

  console.log('PATCH payload (preserving existing args):');
  console.log(JSON.stringify(buildArgsPayload, null, 2));

  try {
    const patchResult = await nfFetch(
      projectApiPath(projectId, `/services/combined/${serviceId}`),
      { method: 'PATCH', body: JSON.stringify(buildArgsPayload) },
    );
    console.log('PATCH result:', patchResult);
  } catch (e) {
    console.error('PATCH failed:', e);
  }
  console.log('=== TRIGGER BUILD END ===');

  // Trigger build from the current branch
  const build = await nfFetch<{
    id: string;
    branch?: string;
    status?: string;
    sha?: string;
    concluded?: boolean;
  }>(projectApiPath(projectId, `/services/${serviceId}/build`), {
    method: 'POST',
    body: JSON.stringify({ sha: currentSha }),
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
