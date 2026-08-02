#!/usr/bin/env tsx
/**
 * Configure a single Northflank combined service with proper standalone settings.
 * 
 * Proper setup for Elevate LMS:
 * - 3 standalone Combined Services: elevate-marketing, elevate-admin, elevate-lms
 * - Each service: 1 container, PORT=3000, independent image, independent deployment
 * 
 * Usage:
 *   pnpm tsx scripts/northflank/configure-nf-service.ts elevate-marketing --execute
 *   pnpm tsx scripts/northflank/configure-nf-service.ts elevate-admin --execute
 *   pnpm tsx scripts/northflank/configure-nf-service.ts elevate-lms --execute
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const SERVICE_CONFIGS: Record<string, {
  dockerfile: string;
  runtimeEnvironment: Record<string, string>;
}> = {
  'elevate-marketing': {
    dockerfile: '/Dockerfile.northflank-marketing',
    runtimeEnvironment: {
      SERVICE_ROLE: 'marketing',
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_WWW_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_APP_URL: 'https://app.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
    },
  },
  'elevate-admin': {
    dockerfile: '/Dockerfile.northflank-admin',
    healthPath: '/api/health',
    runtimeEnvironment: {
      SERVICE_ROLE: 'admin',
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_APP_URL: 'https://app.elevateforhumanity.org',
      NEXT_PUBLIC_WWW_URL: 'https://www.elevateforhumanity.org',
    },
  },
  'elevate-lms': {
    dockerfile: '/Dockerfile.northflank-lms',
    healthPath: '/api/health',
    runtimeEnvironment: {
      SERVICE_ROLE: 'lms',
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_APP_URL: 'https://app.elevateforhumanity.org',
      NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_WWW_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
    },
  },
};

const HEALTH_CHECKS = [
  {
    protocol: 'HTTP',
    type: 'startupProbe',
    path: '/api/health',
    port: 3000,
    initialDelaySeconds: 15,
    periodSeconds: 10,
    timeoutSeconds: 5,
    failureThreshold: 18,
  },
  {
    protocol: 'HTTP',
    type: 'readinessProbe',
    path: '/api/health',
    port: 3000,
    initialDelaySeconds: 5,
    periodSeconds: 10,
    timeoutSeconds: 5,
    failureThreshold: 6,
    successThreshold: 1,
  },
];

async function patchService(
  projectId: string,
  serviceId: string,
  dryRun: boolean,
) {
  const config = SERVICE_CONFIGS[serviceId];
  if (!config) {
    console.error(`Unknown service: ${serviceId}`);
    console.error(`Available: ${Object.keys(SERVICE_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  console.info(`\n=== ${dryRun ? 'DRY RUN' : 'PATCHING'} ${serviceId} ===`);
  console.info(`Dockerfile: ${config.dockerfile}`);
  console.info(`Env vars: ${Object.keys(config.runtimeEnvironment).join(', ')}`);

  if (dryRun) {
    console.info('[dry-run] Would patch: disabledCI=true, healthChecks, strategy=recreate');
    return;
  }

  // Patch service configuration
  const patchBody = {
    // Disable CI/CD - only GitHub Actions should trigger deployments
    disabledCI: true,
    // Deployment strategy: recreate (kill old before starting new)
    deployment: {
      strategy: {
        type: 'recreate',
      },
    },
    // Health checks: startup + readiness probes
    healthChecks: HEALTH_CHECKS,
    // Build settings
    buildSettings: {
      dockerfile: {
        dockerFilePath: config.dockerfile,
        dockerWorkDir: '/',
        buildEngine: 'buildkit',
        buildkit: {
          useCache: false,
          cacheStorageSize: 0,
        },
      },
    },
    // Billing plan
    billing: {
      deploymentPlan: 'nf-compute-400',
      buildPlan: 'nf-compute-800-32',
    },
  };

  const endpoint = projectApiPath(projectId, `/services/combined/${serviceId}`);
  console.info(`PATCH ${endpoint}`);

  try {
    const result = await nfFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(patchBody),
    });
    console.info(`[patch-ok] ${serviceId}:`, JSON.stringify(result).slice(0, 200));
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const match = err.match(/status (\d+)/);
    const status = match ? parseInt(match[1]) : 0;
    
    if (status === 400) {
      // Try without storage/billing constraints
      console.warn(`[patch-retry] ${serviceId}: removing storage constraint...`);
      const retryBody = { ...patchBody };
      delete (retryBody as Record<string, unknown>)['billing'];
      delete (retryBody.buildSettings as Record<string, unknown>)['storage'];
      
      try {
        const result = await nfFetch(endpoint, {
          method: 'PATCH',
          body: JSON.stringify(retryBody),
        });
        console.info(`[patch-ok-retry] ${serviceId}:`, JSON.stringify(result).slice(0, 200));
      } catch (e2) {
        console.error(`[patch-fail] ${serviceId}: ${e2 instanceof Error ? e2.message : e2}`);
      }
    } else {
      console.error(`[patch-fail] ${serviceId}: ${err}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const dryRun = !execute;
  const allFlag = args.includes('--all');
  const serviceIds = allFlag
    ? Object.keys(SERVICE_CONFIGS)
    : args.filter((a) => !a.startsWith('--'));

  if (serviceIds.length === 0) {
    console.error('Usage: tsx configure-nf-service.ts <service-id> [--execute]');
    console.error('Usage: tsx configure-nf-service.ts --all [--execute]');
    console.error('Available services:', Object.keys(SERVICE_CONFIGS).join(', '));
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  console.info(dryRun ? '=== DRY RUN ===' : '=== EXECUTING ===');
  console.info(`Project: ${projectId}`);
  console.info(`Services: ${serviceIds.join(', ')}`);

  for (const serviceId of serviceIds) {
    await patchService(projectId, serviceId, dryRun);
  }

  if (dryRun) {
    console.info('\nRe-run with --execute to apply changes.');
  } else {
    console.info('\nAll service configurations applied.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
