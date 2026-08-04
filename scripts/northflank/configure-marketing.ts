#!/usr/bin/env tsx
/**
 * Configure elevate-marketing service to use correct Dockerfile and port.
 * Uses combinedServicePatchPath to avoid 405 "Method Not Allowed" errors.
 * Usage: npx tsx scripts/northflank/configure-marketing.ts --dry-run
 *        npx tsx scripts/northflank/configure-marketing.ts --execute
 */

import {
  combinedServicePatchPath,
  nfFetch,
  resolveProjectId,
} from './lib';

const healthChecks = [
  {
    protocol: 'HTTP',
    type: 'startupProbe',
    path: '/api/ping',
    port: 3000,
    initialDelaySeconds: 60,
    periodSeconds: 10,
    timeoutSeconds: 10,
    failureThreshold: 12,
  },
  {
    protocol: 'HTTP',
    type: 'readinessProbe',
    path: '/api/health',
    port: 3000,
    initialDelaySeconds: 30,
    periodSeconds: 10,
    timeoutSeconds: 10,
    failureThreshold: 3,
    successThreshold: 1,
  },
];

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  const serviceId = process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing';

  if (!projectId) {
    console.error('Missing NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  console.info(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.info(`Project: ${projectId}, Service: ${serviceId}`);

  // Read current service to know ephemeral storage size already in use
  const service = await nfFetch<any>(combinedServicePatchPath(projectId, serviceId));
  const currentEphemeralMb =
    service?.buildSettings?.storage?.ephemeralStorage?.storageSize ??
    service?.buildConfiguration?.storage?.ephemeralStorage?.storageSize ??
    16384;

  const patch = {
    buildSettings: {
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: '/Dockerfile.marketing',
        dockerWorkDir: '/',
        buildkit: {
          useCache: false,
          cacheStorageSize: 0,
        },
      },
      storage: {
        ephemeralStorage: {
          storageSize: currentEphemeralMb,
        },
      },
    },
    healthChecks,
    buildConfiguration: {
      pathIgnoreRules: [
        'apps/admin/**',
        'apps/lms/**',
        'Dockerfile.northflank-admin',
        'Dockerfile.northflank-lms',
      ],
      storage: {
        ephemeralStorage: {
          storageSize: currentEphemeralMb,
        },
      },
    },
  };

  console.info(
    `${dryRun ? '[dry-run]' : '[patch]'} ${serviceId} -> Dockerfile.marketing, health /api/ping:3000`,
  );

  if (!dryRun) {
    const response = await nfFetch<any>(combinedServicePatchPath(projectId, serviceId), {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    const probes = Array.isArray(response?.healthChecks) ? response.healthChecks : healthChecks;
    const probeSummary = probes
      .map((p: { type?: string; path?: string; port?: number }) =>
        `${p.type ?? '?'}:${p.path ?? '?'}:${p.port ?? '?'}`
      )
      .join(', ');
    console.info(`[patch-ok] ${serviceId} health=[${probeSummary}]`);
    console.info('\n✅ Marketing service configured correctly!');
    console.info('   Dockerfile: /Dockerfile.marketing');
    console.info('   Port: 3000');
    console.info('   Health check: /api/ping');
  } else {
    console.info('\nRe-run with --execute to apply.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
