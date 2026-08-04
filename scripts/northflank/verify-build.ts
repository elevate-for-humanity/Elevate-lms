#!/usr/bin/env tsx
/**
 * Verify that a Northflank build succeeded before deploying.
 * Fails fast if the build failed, preventing deployment of a broken image.
 *
 * Usage:
 *   npx tsx scripts/northflank/verify-build.ts <service-id> --build-id <build-id> --sha <sha>
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const serviceId = process.argv[2];
  const buildId = readArgument('--build-id');
  const expectedSha = readArgument('--sha');

  if (!serviceId || !buildId || !expectedSha) {
    console.error(
      'Usage: verify-build.ts <service-id> --build-id <build-id> --sha <sha>',
    );
    process.exit(1);
  }

  const projectId = resolveProjectId();

  if (!projectId) {
    throw new Error('NORTHFLANK_PROJECT_ID is required.');
  }

  console.log('=== VERIFY BUILD ===');
  console.log(`Service:  ${serviceId}`);
  console.log(`Build ID: ${buildId}`);
  console.log(`SHA:      ${expectedSha}`);

  const response = await nfFetch<any>(
    projectApiPath(projectId, `/services/${serviceId}/build/${buildId}`),
  );

  const build = response?.data ?? response;

  console.log('Build status:', {
    buildId: build?.id,
    status: build?.status,
    concluded: build?.concluded,
    sha: build?.sha,
  });

  // Check for failure states
  if (
    build?.status === 'FAILURE' ||
    build?.status === 'CRASHED' ||
    build?.status === 'ABORTED' ||
    build?.status === 'SUBMISSION_FAILURE' ||
    build?.status === 'TIMEOUT'
  ) {
    throw new Error(
      `Build ${buildId} FAILED with status: ${build?.status}. Refusing to deploy.`,
    );
  }

  // Check for success
  if (build?.status !== 'SUCCESS') {
    throw new Error(
      `Build ${buildId} did not succeed. Status: ${build?.status ?? 'unknown'}. Expected SUCCESS.`,
    );
  }

  // Verify SHA matches
  if (build?.sha && build.sha !== expectedSha) {
    throw new Error(
      `Build SHA mismatch. Expected ${expectedSha}, received ${build?.sha}`,
    );
  }

  console.log(`✅ Build ${buildId} succeeded for exact SHA ${expectedSha}. Safe to deploy.`);
}

main().catch((error) => {
  console.error('❌ VERIFY BUILD FAILED:', error.message);
  process.exit(1);
});
