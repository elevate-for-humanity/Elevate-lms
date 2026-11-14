#!/usr/bin/env tsx
/**
 * Create or update the elevate-admin combined service on Northflank.
 *
 *   npx tsx scripts/northflank/create-admin-service.ts --dry-run
 *   npx tsx scripts/northflank/create-admin-service.ts --execute
 *
 * Env:
 *   NORTHFLANK_API_TOKEN, NORTHFLANK_PROJECT_ID, NORTHFLANK_TEAM_ID
 *   NORTHFLANK_GIT_BRANCH (default: main)
 *   NORTHFLANK_ADMIN_SERVICE_ID (default: elevate-admin)
 */

import { combinedServiceCreatePath, nfFetch, projectApiPath, resolveProjectId, resolveTeamId } from './lib';

const DEFAULT_SERVICE_ID = 'elevate-admin';
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/Dockerfile.northflank-admin';
const RUNTIME_PORT = 3000;

function parseArgs() {
  return {
    dryRun: !process.argv.includes('--execute'),
    serviceId: process.env.NORTHFLANK_ADMIN_SERVICE_ID || DEFAULT_SERVICE_ID,
    branch: process.env.NORTHFLANK_GIT_BRANCH || 'main',
  };
}

function adminServicePayload(serviceId: string, branch: string) {
  return {
    name: serviceId,
    description: 'Elevate admin portal (apps/admin)',
    billing: {
      deploymentPlan: 'nf-compute-400',
    },
    deployment: {
      instances: 1,
      docker: { configType: 'default' },
      storage: {
        shmSize: 64,
        ephemeralStorage: { storageSize: 4096 },
      },
    },
    ports: [
      {
        name: 'site',
        internalPort: RUNTIME_PORT,
        public: true,
        protocol: 'HTTP',
      },
    ],
    buildSource: 'git',
    vcsData: {
      projectUrl: REPO,
      projectType: 'github',
      projectBranch: branch,
    },
    buildSettings: {
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: DOCKERFILE,
        dockerWorkDir: '/',
        buildkit: { useCache: true, cacheStorageSize: 10240 },
      },
    },
    buildConfiguration: {
      // Northflank monorepo allow-list: do not rebuild Admin for Marketing/LMS-only commits.
      // A commit should create a new Admin revision only when Admin itself or code/config
      // that can affect the Admin production image has changed.
      isAllowList: true,
      pathIgnoreRules: [
        'apps/admin/**',
        'packages/**',
        'lib/**',
        'components/**',
        'data/**',
        'public/**',
        'scripts/**',
        'supabase/**',
        'Dockerfile.northflank-admin',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'tsconfig*.json',
        'next.config.*',
        '.npmrc',
      ],
      ciIgnoreFlagsEnabled: true,
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
    },
    runtimeEnvironment: {
      SERVICE_ROLE: 'admin',
      PORT: String(RUNTIME_PORT),
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_LMS_URL: 'https://app.elevateforhumanity.org',
    },
    healthChecks: [
      {
        protocol: 'HTTP',
        type: 'startupProbe',
        path: '/api/ping',
        port: RUNTIME_PORT,
        initialDelaySeconds: 60,
        periodSeconds: 10,
        timeoutSeconds: 10,
        failureThreshold: 12,
      },
      {
        protocol: 'HTTP',
        type: 'readinessProbe',
        path: '/api/health',
        port: RUNTIME_PORT,
        initialDelaySeconds: 30,
        periodSeconds: 10,
        timeoutSeconds: 10,
        failureThreshold: 3,
        successThreshold: 1,
      },
    ],
  };
}

async function serviceExists(projectId: string, serviceId: string): Promise<boolean> {
  try {
    await nfFetch(projectApiPath(projectId, `/services/${serviceId}`));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { dryRun, serviceId, branch } = parseArgs();
  const projectId = resolveProjectId();
  resolveTeamId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const payload = adminServicePayload(serviceId, branch);
  const exists = await serviceExists(projectId, serviceId);

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.log(`Project: ${projectId}`);
  console.log(`Service: ${serviceId} (${exists ? 'update' : 'create'})`);
  console.log(`Git branch: ${branch}`);
  console.log(`Dockerfile: ${DOCKERFILE}`);
  console.log(`Runtime port: ${RUNTIME_PORT}`);

  if (dryRun) {
    console.log('\nPayload summary:', JSON.stringify(payload, null, 2).slice(0, 1200), '...');
    process.exit(0);
  }

  if (exists) {
    await nfFetch(projectApiPath(projectId, `/services/${serviceId}`), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } else {
    await nfFetch(combinedServiceCreatePath(projectId), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  console.log(`\nService "${serviceId}" saved. Northflank will build from branch ${branch}.`);
  console.log('Next:');
  console.log('  1. npx tsx scripts/northflank/sync-env.ts --execute  (links shared secret to Marketing + LMS + Admin)');
  console.log('  2. After domains verified: npx tsx scripts/northflank/configure-domains.ts --execute');
  console.log(`  3. export NORTHFLANK_ADMIN_SERVICE_ID=${serviceId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
