#!/usr/bin/env tsx
/**
 * Provision or update the isolated Elevate subscription/store runtime.
 *
 * The store intentionally reuses the canonical Marketing application/image so
 * commerce, auth and Stripe webhook code are not duplicated. STORE_ONLY_RUNTIME
 * limits this service to /store, auth and commerce APIs while the public website
 * remains owned by elevate-marketing.
 *
 * Usage:
 *   pnpm exec tsx scripts/northflank/configure-store.ts          # validate/dry run
 *   pnpm exec tsx scripts/northflank/configure-store.ts --execute
 */
import { combinedServiceCreatePath, combinedServicePatchPath, nfFetch, projectApiPath, resolveProjectId } from './lib';

const SERVICE_ID = process.env.NORTHFLANK_STORE_SERVICE_ID || 'elevate-store';
const SERVICE_NAME = process.env.NORTHFLANK_STORE_SERVICE_NAME || 'Elevate Subscription Store';
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/Dockerfile.marketing';
const PORT = 3000;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function buildArguments(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
    NEXT_PUBLIC_LMS_URL: process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
  };
}

function payload() {
  const deploymentPlan = process.env.NORTHFLANK_STORE_DEPLOYMENT_PLAN || process.env.NORTHFLANK_DEPLOYMENT_PLAN || 'nf-compute-400';
  const buildPlan = process.env.NORTHFLANK_STORE_BUILD_PLAN || process.env.NORTHFLANK_BUILD_PLAN || 'nf-compute-800-32';
  const storageSize = Number(process.env.NORTHFLANK_STORE_BUILD_STORAGE_MB || '32768');

  return {
    name: SERVICE_NAME,
    description: 'Isolated customer commerce and subscription runtime for Elevate platform SaaS',
    billing: { deploymentPlan, buildPlan },
    infrastructure: { architecture: 'x86' },
    deployment: {
      type: 'deployment',
      instances: Number(process.env.NORTHFLANK_STORE_INSTANCES || '1'),
      docker: { configType: 'default' },
      strategy: {
        type: 'custom',
        settings: { maxSurge: 1, maxUnavailable: 0 },
      },
      gracePeriodSeconds: 60,
    },
    ports: [
      {
        name: 'store',
        internalPort: PORT,
        protocol: 'HTTP',
        public: true,
      },
    ],
    runtimeEnvironment: {
      SERVICE_ROLE: 'store',
      SERVICE_NAME: SERVICE_ID,
      STORE_ONLY_RUNTIME: 'true',
      PORT: String(PORT),
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    healthChecks: [
      {
        protocol: 'HTTP',
        type: 'startupProbe',
        path: '/api/ping',
        port: PORT,
        initialDelaySeconds: 15,
        periodSeconds: 10,
        timeoutSeconds: 5,
        failureThreshold: 24,
      },
      {
        protocol: 'HTTP',
        type: 'readinessProbe',
        path: '/api/health',
        port: PORT,
        initialDelaySeconds: 5,
        periodSeconds: 10,
        timeoutSeconds: 5,
        failureThreshold: 3,
        successThreshold: 1,
      },
      {
        protocol: 'HTTP',
        type: 'livenessProbe',
        path: '/api/ping',
        port: PORT,
        initialDelaySeconds: 60,
        periodSeconds: 30,
        timeoutSeconds: 5,
        failureThreshold: 3,
      },
    ],
    buildSource: 'git',
    disabledCI: true,
    vcsData: {
      projectUrl: REPO,
      projectType: 'github',
      projectBranch: 'main',
    },
    buildArguments: buildArguments(),
    buildSettings: {
      storage: { ephemeralStorage: { storageSize } },
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: DOCKERFILE,
        dockerWorkDir: '/',
        buildkit: { useCache: true, cacheStorageSize: Math.min(storageSize, 32768) },
      },
    },
    buildConfiguration: {
      storage: { ephemeralStorage: { storageSize } },
      ciIgnoreFlagsEnabled: true,
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
    },
  };
}

async function exists(projectId: string): Promise<boolean> {
  try {
    await nfFetch(projectApiPath(projectId, `/services/${SERVICE_ID}`));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('404') || message.includes('Could not find service')) return false;
    throw error;
  }
}

async function main() {
  const execute = process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  // Always validate build arguments before touching production.
  const desired = payload();
  const serviceExists = await exists(projectId);
  console.log(execute ? '=== EXECUTE ===' : '=== DRY RUN ===');
  console.log(`Project: ${projectId}`);
  console.log(`Service: ${SERVICE_ID} (${serviceExists ? 'existing' : 'new'})`);
  console.log(`Dockerfile: ${DOCKERFILE}`);
  console.log('Runtime isolation: STORE_ONLY_RUNTIME=true');

  if (!execute) {
    console.log('Validation complete. Re-run with --execute to provision/update Northflank.');
    return;
  }

  const path = serviceExists
    ? combinedServicePatchPath(projectId, SERVICE_ID)
    : combinedServiceCreatePath(projectId);
  const method = serviceExists ? 'PATCH' : 'POST';
  await nfFetch(path, { method, body: JSON.stringify(desired) });

  const buildResult = await nfFetch<any>(projectApiPath(projectId, `/services/${SERVICE_ID}/build`), {
    method: 'POST',
    body: JSON.stringify({}),
  });

  console.log(`Store service ${serviceExists ? 'updated' : 'created'} successfully.`);
  console.log(`Build triggered: ${buildResult?.id || 'accepted'}`);
  console.log('Next required step: run sync-env.ts with NORTHFLANK_STORE_SERVICE_ID=elevate-store so the shared production secret group is attached.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
