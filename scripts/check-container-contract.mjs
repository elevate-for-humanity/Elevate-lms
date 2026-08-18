#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const read = (path) => readFileSync(path, 'utf8');

const services = [
  {
    name: 'marketing',
    configPath: 'northflank_marketing.json',
    dockerPath: 'Dockerfile.marketing',
    expectedServiceName: 'elevate-marketing',
    expectedDockerfile: '/Dockerfile.marketing',
    expectedPort: 3000,
  },
  {
    name: 'admin',
    configPath: 'northflank_admin.json',
    dockerPath: 'Dockerfile.northflank-admin',
    expectedServiceName: 'elevate-admin',
    expectedDockerfile: '/Dockerfile.northflank-admin',
    expectedPort: 3000,
  },
  {
    name: 'lms',
    configPath: 'northflank_config.json',
    dockerPath: 'Dockerfile.northflank-lms',
    expectedServiceName: 'elevate-lms',
    expectedDockerfile: '/Dockerfile.northflank-lms',
    expectedPort: 3000,
  },
];

const requiredUrls = {
  NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  NEXT_PUBLIC_APP_URL: 'https://app.elevateforhumanity.org',
};

let failures = 0;
const fail = (message) => { console.error(`❌ ${message}`); failures += 1; };
const pass = (message) => console.log(`✅ ${message}`);

for (const service of services) {
  const config = readJson(service.configPath);
  const docker = read(service.dockerPath);

  if (config.name !== service.expectedServiceName) {
    fail(`${service.name}: Northflank service name is ${config.name ?? 'missing'}, expected ${service.expectedServiceName}.`);
  }
  if (config.vcsData?.projectBranch !== 'main') {
    fail(`${service.name}: production config must deploy main.`);
  }
  if (config.vcsData?.dockerFilePath !== service.expectedDockerfile) {
    fail(`${service.name}: Dockerfile contract drift (${config.vcsData?.dockerFilePath ?? 'missing'}).`);
  }

  const probes = [
    ['healthCheck', config.deployment?.healthCheck],
    ['startupProbe', config.deployment?.startupProbe],
    ['readinessProbe', config.deployment?.readinessProbe],
  ].filter(([, probe]) => probe?.enabled);

  if (probes.length === 0) fail(`${service.name}: no enabled deployment health/readiness probe.`);
  for (const [kind, probe] of probes) {
    if (Number(probe.port) !== service.expectedPort) {
      fail(`${service.name}: ${kind} uses port ${probe.port}; container runtime uses ${service.expectedPort}.`);
    }
  }

  if (!new RegExp(`EXPOSE\\s+${service.expectedPort}\\b`).test(docker)) {
    fail(`${service.name}: Dockerfile does not expose ${service.expectedPort}.`);
  }
  if (!docker.includes(`PORT=${service.expectedPort}`)) {
    fail(`${service.name}: Dockerfile does not declare runtime PORT=${service.expectedPort}.`);
  }

  for (const [key, expected] of Object.entries(requiredUrls)) {
    const configured = config.buildArgs?.[key] ?? config.buildSecrets?.[key];
    if (configured !== expected) {
      fail(`${service.name}: ${key} is ${configured ?? 'missing'}, expected ${expected}.`);
    }
  }

  if (!docker.includes('NF_GIT_SHA')) {
    fail(`${service.name}: Dockerfile is not tied to Northflank NF_GIT_SHA build identity.`);
  }

  pass(`${service.name}: deployment contract inspected.`);
}

// The compatibility contract deliberately does NOT require one service to be
// reachable for another service to start. Cross-service health is a release
// verification concern, not an individual container liveness dependency.

if (failures) {
  console.error(`\n❌ Container contract failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Marketing, Admin, and LMS share a compatible deployment contract.');
