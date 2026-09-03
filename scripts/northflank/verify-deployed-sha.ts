#!/usr/bin/env tsx
/**
 * Verify that each Northflank service is running the expected Git SHA.
 *
 * This script is intentionally read-only.
 * It must never trigger builds, scale services, or mutate deployment config.
 *
 *   EXPECTED_SHA=$(git rev-parse origin/main) npx tsx scripts/northflank/verify-deployed-sha.ts
 *   npx tsx scripts/northflank/verify-deployed-sha.ts elevate-marketing
 */

import { execSync } from 'node:child_process';

import {
  nfFetch,
  projectApiPath,
  resolveProjectId,
} from './lib';

type ServiceStatus = {
  vcsData?: {
    projectBranch?: string;
  };
  deployment?: {
    internal?: {
      deployedSHA?: string;
      buildSHA?: string;
      buildId?: string;
      branch?: string;
    };
  };
  status?: {
    build?: {
      status?: string;
    };
    deployment?: {
      status?: string;
    };
  };
  deployedSHA?: string;
};

type VerificationResult = 'valid' | 'retryable' | 'invalid';

const RETRYABLE_DEPLOYMENT_STATUSES = new Set([
  'PENDING',
  'IN_PROGRESS',
  'DEPLOYING',
  'ROLLING_OUT',
]);

const ALL_SERVICES = [
  'elevate-marketing',
  'elevate-admin',
  'elevate-lms',
] as const;

const SERVICE_URLS: Record<string, string> = {
  'elevate-marketing': 'https://www.elevateforhumanity.org',
  'elevate-admin': 'https://admin.elevateforhumanity.org',
  'elevate-lms': 'https://app.elevateforhumanity.org',
};

function resolveExpectedSha(): string {
  const configured = process.env.EXPECTED_SHA ?? process.env.GITHUB_SHA ?? process.env.BUILD_SHA;
  if (configured?.trim()) return configured.trim();
  try {
    return execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
  } catch {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  }
}

function validateExpectedSha(sha: string): void {
  if (!/^[a-f0-9]{40}$/i.test(sha)) {
    throw new Error(`Expected a full 40-character Git SHA. Received: ${sha}`);
  }
}

function shaMatches(actual: string | undefined, expected: string): boolean {
  if (!actual) return false;
  const na = actual.toLowerCase();
  const ne = expected.toLowerCase();
  return (
    na === ne ||
    (na.length >= 7 && ne.startsWith(na)) ||
    (ne.length >= 7 && na.startsWith(ne))
  );
}

function resolveNorthflankSha(service: ServiceStatus): string | undefined {
  return (
    service.deployment?.internal?.deployedSHA ??
    service.deployment?.internal?.buildSHA ??
    service.deployedSHA
  );
}

async function readRuntimeVersion(serviceId: string): Promise<{
  status: number;
  commit?: string;
  body: string;
}> {
  const origin = SERVICE_URLS[serviceId];
  if (!origin) return { status: 0, body: 'No runtime URL configured.' };

  const endpoints = ['/api/version', '/api/health/build-version', '/version.json'];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${origin}${endpoint}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      const body = await response.text();
      if (!response.ok) continue;
      let commit: string | undefined;
      try {
        const parsed = JSON.parse(body);
        commit =
          parsed.commit ??
          parsed.sha ??
          parsed.commitSha ??
          parsed.shortSha ??
          parsed.gitSha ??
          parsed.git_sha ??
          parsed.buildSha ??
          parsed.build_sha ??
          parsed.version;
      } catch {
        commit = undefined;
      }
      return { status: response.status, commit, body };
    } catch {
      // Try the next endpoint.
    }
  }
  return { status: 0, body: 'No runtime version endpoint responded.' };
}

async function verifyService(
  projectId: string,
  serviceId: string,
  expectedSha: string,
): Promise<VerificationResult> {
  const service = await nfFetch<ServiceStatus>(
    projectApiPath(projectId, `/services/${serviceId}`),
  );

  const northflankSha = resolveNorthflankSha(service);
  const buildStatus = service.status?.build?.status ?? 'unknown';
  const deploymentStatus = service.status?.deployment?.status ?? 'unknown';
  const branch =
    service.vcsData?.projectBranch ??
    service.deployment?.internal?.branch ??
    'unknown';
  const buildId = service.deployment?.internal?.buildId ?? 'unknown';
  const runtime = await readRuntimeVersion(serviceId);

  const northflankMatches = shaMatches(northflankSha, expectedSha);
  const runtimeMatches = shaMatches(runtime.commit, expectedSha);

  console.log('\n========================================');
  console.log(`Service: ${serviceId}`);
  console.log(`Expected SHA: ${expectedSha}`);
  console.log(`Northflank SHA: ${northflankSha ?? 'missing'}`);
  console.log(`Runtime SHA: ${runtime.commit ?? 'missing'}`);
  console.log(`Build ID: ${buildId}`);
  console.log(`Branch: ${branch}`);
  console.log(`Build status: ${buildStatus}`);
  console.log(`Deployment status: ${deploymentStatus}`);
  console.log(`Northflank SHA match: ${northflankMatches ? 'YES' : 'NO'}`);
  console.log(`Runtime SHA match: ${runtimeMatches ? 'YES' : 'NO'}`);

  const BUILD_FAILURE_STATUSES = new Set(['FAILURE', 'FAILED', 'CRASHED', 'ABORTED', 'ERROR']);
  if (BUILD_FAILURE_STATUSES.has(buildStatus)) {
    console.error(`${serviceId}: latest build failed. The previous image may still be serving traffic.`);
    return 'invalid';
  }

  // Runtime HTTP health is the source of truth. Northflank deployment.internal.deployedSHA
  // is known to be stale for API-triggered builds — it only updates for UI-triggered deploys.
  // If runtime matches, the container is running the correct SHA.
  if (runtimeMatches) {
    if (!northflankMatches) {
      console.warn(`${serviceId}: Northflank metadata SHA is stale (${northflankSha ?? 'null'}), but runtime confirms ${expectedSha.slice(0, 7)}. Trusting runtime.`);
    }
    return 'valid';
  }

  const normalizedDeploymentStatus = deploymentStatus.toUpperCase();
  if (RETRYABLE_DEPLOYMENT_STATUSES.has(normalizedDeploymentStatus)) {
    console.warn(
      `${serviceId}: deployment is ${deploymentStatus}; the runtime may still route to the retiring revision.`,
    );
    return 'retryable';
  }

  // Runtime doesn't match after the deployment left a transitional state.
  if (!northflankMatches) {
    console.error(`${serviceId}: neither Northflank metadata nor runtime commit matches ${expectedSha.slice(0, 7)}.`);
    return 'invalid';
  }

  // Northflank matches but runtime doesn't — unusual state, fail.
  console.error(`${serviceId}: Northflank metadata matches but runtime reports ${runtime.commit ?? 'null'}.`);
  return 'invalid';
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main(): Promise<void> {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required.');

  const expectedSha = resolveExpectedSha();
  validateExpectedSha(expectedSha);

  const requestedService = process.argv.find((argument) => argument.startsWith('elevate-'));
  const services = requestedService
    ? [requestedService]
    : process.env.NORTHFLANK_VERIFY_SERVICE
      ? [process.env.NORTHFLANK_VERIFY_SERVICE]
      : [...ALL_SERVICES];

  let failed = false;

  console.log(`Expected production SHA: ${expectedSha}`);

  for (const serviceId of services) {
    try {
      let result: VerificationResult = 'invalid';
      for (let attempt = 1; attempt <= 20; attempt += 1) {
        result = await verifyService(projectId, serviceId, expectedSha);
        if (result !== 'retryable') break;
        console.log(`${serviceId}: convergence check ${attempt}/20 did not reach the new runtime; retrying in 15s.`);
        if (attempt < 20) await wait(15_000);
      }
      if (result !== 'valid') failed = true;
    } catch (error) {
      failed = true;
      console.error(`${serviceId}: verification error`, error);
    }
  }

  if (failed) {
    console.error('\nDeployment verification failed.');
    console.error('Do not mark this deployment successful and do not rely on the previous healthy image.');
    process.exit(1);
  }

  console.log('\nAll service runtimes match the expected SHA.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
