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

/** Find a reusable build for the given SHA - only reuse successful/in-progress builds */
async function findReusableBuild(
  recentBuilds: Array<{ id: string; sha?: string; status?: string; concluded?: boolean }>,
  currentSha: string,
): Promise<{ id: string; status: string } | null> {
  const reusableBuild = recentBuilds.find(
    (build) =>
      build.sha === currentSha &&
      (build.status === 'SUCCESS' ||
        build.status === 'BUILDING' ||
        build.status === 'PENDING' ||
        build.status === 'QUEUED' ||
        build.status === 'IN_PROGRESS'),
  );

  if (reusableBuild) {
    console.log(
      `Reusing build ${reusableBuild.id} for SHA ${currentSha}. Status: ${reusableBuild.status}`,
    );
    return { id: reusableBuild.id, status: reusableBuild.status || 'unknown' };
  }

  const failedBuild = recentBuilds.find(
    (build) =>
      build.sha === currentSha &&
      (build.status === 'FAILURE' ||
        build.status === 'CRASHED' ||
        build.status === 'ABORTED' ||
        build.status === 'SUBMISSION_FAILURE'),
  );

  if (failedBuild) {
    console.log(
      `Previous build ${failedBuild.id} for ${currentSha} failed. Starting a fresh build.`,
    );
  }

  return null;
}

/** Fetch existing buildArguments from Northflank to preserve them. */
async function getExistingBuildArguments(
  projectId: string,
  serviceId: string,
): Promise<Record<string, string>> {
  const endpoints = [
    projectApiPath(projectId, `/services/combined/${serviceId}`),
    projectApiPath(projectId, `/services/${serviceId}`),
    projectApiPath(projectId, `/services/${serviceId}/build`),
    projectApiPath(projectId, `/services/combined/${serviceId}/build`),
  ];

  for (const endpoint of endpoints) {
    try {
      const service = await nfFetch<Record<string, unknown>>(endpoint);
      const args =
        (service.buildArguments as Record<string, string> | undefined) ??
        ((service.build as Record<string, unknown>)?.buildArguments as Record<string, string> | undefined) ??
        {};
      if (args && Object.keys(args).length > 0) {
        console.log(`Found buildArguments at ${endpoint}:`, Object.keys(args));
        return args;
      }
    } catch {
      // Continue to next endpoint
    }
  }

  console.log('No existing buildArguments found at any endpoint');
  return {};
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

  // Check for existing build with same SHA — only skip if a SUCCESSFUL/in-progress build exists
  // Do NOT reuse failed builds - they need a fresh build attempt
  const forceFreshBuild = process.env.FORCE_FRESH_BUILD === 'true';
  
  if (currentSha && !forceFreshBuild) {
    const recentBuilds = await getRecentBuilds(projectId, serviceId, currentSha);
    const reusableBuild = await findReusableBuild(recentBuilds, currentSha);

    if (reusableBuild) {
      console.log(
        `Skipping build for ${serviceId} - SHA ${currentSha} already has successful build ${reusableBuild.id} (status: ${reusableBuild.status})`,
      );
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${reusableBuild.id}\n`, 'utf8');
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `skipped=true\n`, 'utf8');
      }
      return;
    }
  } else if (forceFreshBuild) {
    console.log(
      `FORCE_FRESH_BUILD=true — bypassing build reuse, starting fresh build.`,
    );
  }

  console.log('=== TRIGGER BUILD ===');
  console.log('Service:', serviceId);
  console.log('currentSha:', currentSha);

  // CRITICAL FIX: Fetch existing buildArguments (Supabase URL, anon key, etc.)
  // and MERGE with git-related arguments. This prevents overwriting the
  // Supabase build arguments that configure-services.ts set.
  const existingArgs = await getExistingBuildArguments(projectId, serviceId);
  console.log('Existing buildArguments:', Object.keys(existingArgs));

  // Service name from service ID (e.g. "elevate-admin" → "admin")
  const serviceName = serviceId.replace(/^elevate-/, '');
  const buildId = `${serviceName}-${currentSha}`;

  // Merge: keep existing args (Supabase, etc.) + add/update git args
  const mergedBuildArguments: Record<string, string> = {
    ...existingArgs,
    GITHUB_SHA: currentSha,
    GIT_SHA: currentSha,
    NEXT_PUBLIC_GIT_SHA: currentSha,
    NEXT_PUBLIC_BUILD_ID: buildId,
    NEXT_PUBLIC_SERVICE_NAME: serviceName,
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
  // no_cache: true forces a fresh Docker layer rebuild — required when
  // Dockerfile changes (pnpm version, native modules, build identity) are made.
  const build = await nfFetch<{
    id: string;
    branch?: string;
    status?: string;
    sha?: string;
    concluded?: boolean;
  }>(projectApiPath(projectId, `/services/${serviceId}/build`), {
    method: 'POST',
    body: JSON.stringify({ sha: currentSha, no_cache: true }),
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
