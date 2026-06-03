#!/usr/bin/env tsx
/**
 * Ensure Northflank combined services use BuildKit layer cache (10GB).
 *
 *   pnpm tsx scripts/northflank/ensure-build-cache.ts --dry-run
 *   pnpm tsx scripts/northflank/ensure-build-cache.ts --execute
 */

import { combinedServicePath, nfFetch, resolveProjectId } from './lib';

const SERVICES = [
  {
    id: process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
    dockerfile: '/Dockerfile.northflank-lms',
  },
  {
    id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
    dockerfile: '/Dockerfile.northflank-admin',
  },
];

const BUILDKIT = {
  useCache: true,
  cacheStorageSize: 10240,
};

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  for (const { id, dockerfile } of SERVICES) {
    const patch = {
      buildSettings: {
        dockerfile: {
          buildEngine: 'buildkit',
          dockerFilePath: dockerfile,
          dockerWorkDir: '/',
          buildkit: BUILDKIT,
        },
      },
    };
    console.log(`${dryRun ? '[dry-run]' : '[patch]'} ${id} → ${dockerfile} cache ${BUILDKIT.cacheStorageSize}MB`);
    if (!dryRun) {
      await nfFetch(combinedServicePath(projectId, id), {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    }
  }

  if (dryRun) {
    console.log('\nRe-run with --execute to apply.');
  } else {
    console.log('\nBuildKit cache enabled on both services.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
