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
        internalPort: 8080,
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
      pathIgnoreRules: [
        'exports/**',
        '**/*.md',
        '.git/**',
        'node_modules/**',
        '.next/**',
        'apps/admin/.next/**',
      ],
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
    },
    runtimeEnvironment: {
      SERVICE_ROLE: 'admin',
      PORT: '8080',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
    },
    healthChecks: [
      {
        protocol: 'HTTP',
        type: 'readinessProbe',
        path: '/admin',
        port: 8080,
        initialDelaySeconds: 30,
        periodSeconds: 10,
        timeoutSeconds: 5,
        failureThreshold: 6,
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
  const teamId = resolveTeamId();
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
  console.log('  1. npx tsx scripts/northflank/sync-env.ts --execute  (links secret to both services)');
  console.log('  2. After domains verified: npx tsx scripts/northflank/configure-domains.ts --execute');
  console.log(`  3. export NORTHFLANK_ADMIN_SERVICE_ID=${serviceId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
