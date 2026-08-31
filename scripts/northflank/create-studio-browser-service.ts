#!/usr/bin/env tsx
/** Create/update the isolated open-source Studio browser service. */
import crypto from 'node:crypto';
import { combinedServiceCreatePath, nfFetch, projectApiPath, resolveProjectId } from './lib.ts';

const serviceId = process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
const branch = process.env.NORTHFLANK_GIT_BRANCH || 'main';
const execute = process.argv.includes('--execute');
const projectId = resolveProjectId();
if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

async function exists() {
  try {
    await nfFetch(projectApiPath(projectId!, `/services/${serviceId}`));
    return true;
  } catch {
    return false;
  }
}

const secret = process.env.STUDIO_BROWSER_SECRET || crypto.randomBytes(32).toString('base64url');
const payload = {
  name: serviceId,
  description: 'Isolated Playwright Chromium runtime for canonical Admin Dev Studio',
  billing: { deploymentPlan: 'nf-compute-200' },
  // Chromium runs with --disable-dev-shm-usage, so a large /dev/shm reservation
  // is unnecessary and exceeds the production project's resource allowance.
  deployment: {
    instances: 1,
    docker: { configType: 'default' },
    storage: { shmSize: 256, ephemeralStorage: { storageSize: 2048 } },
  },
  ports: [{ name: 'browser', internalPort: 3100, public: true, protocol: 'HTTP' }],
  buildSource: 'git',
  vcsData: {
    projectUrl: 'https://github.com/elevate-for-humanity/Elevate-lms',
    projectType: 'github',
    projectBranch: branch,
  },
  buildSettings: {
    dockerfile: {
      buildEngine: 'buildkit',
      dockerFilePath: '/Dockerfile.studio-browser',
      dockerWorkDir: '/',
      buildkit: { useCache: true, cacheStorageSize: 4096 },
    },
  },
  runtimeEnvironment: {
    NODE_ENV: 'production',
    PORT: '3100',
    STUDIO_BROWSER_SECRET: secret,
    STUDIO_BROWSER_ADMIN_ORIGIN: 'https://admin.elevateforhumanity.org',
    STUDIO_BROWSER_ALLOWED_DOMAINS: 'elevateforhumanity.org',
    STUDIO_BROWSER_SESSION_TTL_MS: '900000',
    STUDIO_BROWSER_MAX_SESSIONS: '4',
  },
  healthChecks: [
    {
      protocol: 'HTTP',
      type: 'readinessProbe',
      path: '/health',
      port: 3100,
      initialDelaySeconds: 15,
      periodSeconds: 10,
      timeoutSeconds: 5,
      failureThreshold: 3,
      successThreshold: 1,
    },
  ],
};

console.log(
  `${execute ? 'EXECUTE' : 'DRY RUN'}: ${serviceId} from ${branch}, Dockerfile.studio-browser, port 3100`,
);
if (!execute) process.exit(0);
if (await exists())
  await nfFetch(projectApiPath(projectId, `/services/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
else
  await nfFetch(combinedServiceCreatePath(projectId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
console.log(
  `Studio browser service saved. Configure Admin with STUDIO_BROWSER_URL, STUDIO_BROWSER_PUBLIC_URL, NEXT_PUBLIC_STUDIO_BROWSER_URL and the same STUDIO_BROWSER_SECRET.`,
);
