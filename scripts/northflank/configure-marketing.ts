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

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required but was not provided.`);
  }
  return value;
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  const serviceId = process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing';

  if (!projectId) {
    console.error('Missing NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  // ─── Build arguments (required for Docker build) ──────────────────────────
  const nextPublicSupabaseUrl = requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL');
  const nextPublicSupabaseAnonKey = requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const nextPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.elevateforhumanity.org';
  const nextPublicAdminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.elevateforhumanity.org';

  const marketingBuildArguments: Record<string, string> = {
    NEXT_PUBLIC_SITE_URL: nextPublicSiteUrl,
    NEXT_PUBLIC_APP_URL: nextPublicAppUrl,
    NEXT_PUBLIC_ADMIN_URL: nextPublicAdminUrl,
    NEXT_PUBLIC_SUPABASE_URL: nextPublicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: nextPublicSupabaseAnonKey,
  };

  console.info(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.info(`Project: ${projectId}, Service: ${serviceId}`);
  console.info('Build arguments:', Object.keys(marketingBuildArguments));

  // Read current service using the regular service path (combined path only works for PATCH, not GET)
  const serviceGetPath = `/projects/${projectId}/services/${serviceId}`;
  const service = await nfFetch<any>(serviceGetPath);
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
    buildArguments: marketingBuildArguments,
    healthChecks,
    // NOTE: pathIgnoreRules removed. When Dockerfile.marketing is excluded,
    // Northflank uses cached layers and does not push a new image — so the
    // deployment.internal.buildSHA never updates. Always include all files so
    // each build produces a unique image and the deployment tracks the new SHA.
    buildConfiguration: {
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
    console.info('   Build arguments:', Object.keys(marketingBuildArguments));
  } else {
    console.info('\nRe-run with --execute to apply.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
