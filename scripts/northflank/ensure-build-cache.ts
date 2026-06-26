#!/usr/bin/env tsx
/**
 * Ensure Northflank services BuildKit cache settings (disabled — ENOSPC on shared builders).
 *
 *   npx tsx scripts/northflank/ensure-build-cache.ts elevate-lms --execute
 *   npx tsx scripts/northflank/ensure-build-cache.ts --all --execute
 */

import { combinedServicePatchPath, nfFetch, resolveProjectId } from './lib';
import { NORTHFLANK_SERVICE_CONFIGS } from './configure-services';
import { resolveTargetServiceIds } from './service-targets';

const BUILDKIT = {
  useCache: false,
  cacheStorageSize: 0,
};

const SERVICE_DOCKERFILES = Object.fromEntries(
  NORTHFLANK_SERVICE_CONFIGS.map((s) => [s.id, s.dockerfile]),
);

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const targets = resolveTargetServiceIds();
  console.log(`Targets: ${targets.join(', ')}`);

  for (const id of targets) {
    const dockerfile = SERVICE_DOCKERFILES[id];
    if (!dockerfile) {
      console.error(`Unknown service id (no Dockerfile mapping): ${id}`);
      process.exit(1);
    }
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
      await nfFetch(combinedServicePatchPath(projectId, id), {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    }
  }

  if (dryRun) {
    console.log('\nRe-run with --execute to apply.');
  } else {
    console.log('\nBuildKit cache enabled on target service(s).');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
