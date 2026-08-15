#!/usr/bin/env node

const API_BASE = 'https://api.northflank.com/v1';
const token = process.env.NORTHFLANK_API_TOKEN;
const projectId = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const serviceId = process.env.NORTHFLANK_BUILDER_SERVICE_ID || 'elevate-website-builder';
const branch = process.env.NORTHFLANK_GIT_BRANCH || 'refactor/website-builder-standalone-20260814';
const execute = process.argv.includes('--execute');

if (!token) throw new Error('NORTHFLANK_API_TOKEN is required');

async function nf(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) throw new Error(`Northflank ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`);
  return body.data ?? body;
}

const payload = {
  name: serviceId,
  description: 'Elevate standalone Website Builder',
  billing: { deploymentPlan: 'nf-compute-400' },
  deployment: {
    instances: 1,
    docker: { configType: 'default' },
    storage: { shmSize: 64, ephemeralStorage: { storageSize: 4096 } },
  },
  ports: [{ name: 'site', internalPort: 3000, public: true, protocol: 'HTTP' }],
  buildSource: 'git',
  vcsData: {
    projectUrl: 'https://github.com/elevate-for-humanity/Elevate-lms',
    projectType: 'github',
    projectBranch: branch,
  },
  buildSettings: {
    dockerfile: {
      buildEngine: 'buildkit',
      dockerFilePath: '/Dockerfile.northflank-builder',
      dockerWorkDir: '/',
      buildkit: { useCache: true, cacheStorageSize: 10240 },
    },
  },
  buildConfiguration: {
    pathIgnoreRules: [
      'exports/**', '**/*.md', '.git/**', 'node_modules/**', '.next/**',
      'apps/admin/**', 'apps/lms/**',
    ],
    ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
  },
  runtimeEnvironment: {
    SERVICE_ROLE: 'website-builder',
    PORT: '3000',
    HOSTNAME: '0.0.0.0',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_BUILDER_URL: 'https://builder.elevateforhumanity.org',
    NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_LMS_URL: 'https://app.elevateforhumanity.org',
    NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  },
  healthChecks: [
    {
      protocol: 'HTTP', type: 'startupProbe', path: '/api/ping', port: 3000,
      initialDelaySeconds: 30, periodSeconds: 10, timeoutSeconds: 10, failureThreshold: 12,
    },
    {
      protocol: 'HTTP', type: 'readinessProbe', path: '/api/health', port: 3000,
      initialDelaySeconds: 15, periodSeconds: 10, timeoutSeconds: 10, failureThreshold: 3, successThreshold: 1,
    },
  ],
};

async function main() {
  let exists = false;
  try {
    await nf(`/projects/${projectId}/services/${serviceId}`);
    exists = true;
  } catch (error) {
    if (!String(error).includes('404')) throw error;
  }

  console.log(JSON.stringify({ execute, projectId, serviceId, branch, exists, dockerfile: '/Dockerfile.northflank-builder' }, null, 2));
  if (!execute) return;

  if (exists) {
    await nf(`/projects/${projectId}/services/combined/${serviceId}`, {
      method: 'PATCH', body: JSON.stringify(payload),
    });
  } else {
    await nf(`/projects/${projectId}/services/combined`, {
      method: 'POST', body: JSON.stringify(payload),
    });
  }

  console.log(`Northflank service ${serviceId} saved from ${branch}. No custom domain was attached.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
