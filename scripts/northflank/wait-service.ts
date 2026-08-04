#!/usr/bin/env tsx
/**
 * Wait for a Northflank service deployment/build to settle.
 *
 * Usage:
 *   npx tsx scripts/northflank/wait-service.ts elevate-admin
 *   npx tsx scripts/northflank/wait-service.ts elevate-lms --timeout-ms 1200000
 *   npx tsx scripts/northflank/wait-service.ts elevate-admin --build-id <id>
 */

import { nfFetch, projectApiPath, combinedServicePath, resolveProjectId } from './lib';

type ServiceStatus = {
  deploymentStatus?: { status?: string };
  buildStatus?: string;
  status?: {
    build?: { status?: string; lastTransitionTime?: string };
    deployment?: { status?: string; reason?: string; lastTransitionTime?: string };
  };
};

type ServiceBuild = {
  id: string;
  branch?: string;
  status?: string;
  sha?: string;
  concluded?: boolean;
  success?: boolean;
  message?: string | null;
  createdAt?: string;
  buildConcludedAt?: number;
};

type ServiceBuildList = {
  builds?: ServiceBuild[];
};

type BuildLogLine = {
  containerId?: string;
  log?: string;
  ts?: string;
};

const BUILD_FAILURE_STATUSES = new Set([
  'ABORTED',
  'CRASHED',
  'ERROR',
  'FAILED',
  'FAILURE',
  'SUBMISSION_FAILURE',
]);
const BUILD_DONE_STATUSES = new Set(['SUCCESS', 'COMPLETED', 'SKIPPED']);
// PENDING is included because Northflank combined services sometimes report
// deployment status as PENDING even after containers are running and healthy.
const DEPLOY_READY_STATUSES = new Set(['COMPLETED', 'RUNNING', 'SUCCESS', 'PENDING']);
const DEPLOY_FAILURE_STATUSES = new Set(['FAILED', 'ERROR']);

// Map service IDs to their health check URLs
const SERVICE_HEALTH_URLS: Record<string, string> = {
  'elevate-marketing': 'https://www.elevateforhumanity.org/api/health',
  'elevate-lms': 'https://app.elevateforhumanity.org/api/ping',
  'elevate-admin': 'https://admin.elevateforhumanity.org/api/ping',
};

// Map service IDs to their expected commit SHA (from GITHUB_SHA env var)
function getExpectedSha(): string {
  return (
    process.env.GITHUB_SHA ||
    process.env.BUILD_SHA ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    ''
  );
}

/**
 * Check if the service health endpoint returns a successful response.
 * This is the definitive test for whether the new container image is running.
 */
async function checkHttpHealth(serviceId: string, commitSha: string): Promise<{ ok: boolean; currentCommit: string; error?: string }> {
  const url = SERVICE_HEALTH_URLS[serviceId];
  if (!url) return { ok: false, currentCommit: '', error: 'no health URL configured' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'wait-service/1.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, currentCommit: '', error: `HTTP ${res.status}` };
    }

    const body = await res.json().catch(() => ({}));
    const currentCommit = body.commit || body.buildId || '';

    // Fail immediately if build identity is missing — this means the Docker
    // runner stage never received the GIT_SHA/GITHUB_SHA build args.
    // Waiting for "unknown" to match the expected SHA will never succeed.
    if (!currentCommit || currentCommit === 'unknown' || currentCommit === 'MISSING') {
      return {
        ok: false,
        currentCommit,
        error: `runtime build identity missing (got "${currentCommit || ''}"). Dockerfile runner stage is missing GIT_SHA/GITHUB_SHA env vars — fix Dockerfile and redeploy.`,
      };
    }

    // If we have an expected SHA, verify it matches
    if (commitSha && currentCommit && !currentCommit.startsWith(commitSha.slice(0, 7))) {
      return {
        ok: false,
        currentCommit,
        error: `commit mismatch: expected ${commitSha.slice(0, 7)}, got ${currentCommit.slice(0, 7)}`,
      };
    }

    return { ok: true, currentCommit };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, currentCommit: '', error: 'timeout' };
    }
    return { ok: false, currentCommit: '', error: err.message || String(err) };
  }
}

function resolveServicePhase(service: ServiceStatus): string {
  const build = service.status?.build?.status ?? service.buildStatus;
  const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;

  if (build && !BUILD_DONE_STATUSES.has(build)) {
    return build;
  }
  if (deploy) return deploy;
  return build ?? deploy ?? 'unknown';
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(
      /((?:token|secret|password|authorization|api[_-]?key|private[_-]?key)[\w-]*\s*[:=]\s*)[^\s,;]+/gi,
      '$1[redacted]',
    );
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      if (/token|secret|password|authorization|api[_-]?key|private[_-]?key/i.test(key)) {
        return [key, '[redacted]'];
      }
      return [key, redactValue(nested)];
    }),
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function resolveBuildId(
  projectId: string,
  serviceId: string,
  preferredBuildId?: string,
): Promise<string | undefined> {
  const normalized = preferredBuildId?.trim();
  if (normalized) return normalized;

  try {
    const list = await nfFetch<ServiceBuildList>(
      projectApiPath(projectId, `/services/${serviceId}/build?per_page=1`),
    );
    return list.builds?.[0]?.id;
  } catch (error) {
    console.error(`Could not resolve latest Northflank build id: ${formatError(error)}`);
    return undefined;
  }
}

async function fetchBuildDetails(
  projectId: string,
  serviceId: string,
  buildId: string,
): Promise<ServiceBuild | undefined> {
  try {
    return await nfFetch<ServiceBuild>(
      projectApiPath(projectId, `/services/${serviceId}/build/${buildId}`),
    );
  } catch (error) {
    console.error(`Could not fetch Northflank build ${buildId}: ${formatError(error)}`);
    return undefined;
  }
}

async function printBuildLogs(
  projectId: string,
  serviceId: string,
  buildId: string,
): Promise<void> {
  const params = new URLSearchParams({
    buildId,
    queryType: 'range',
    endTime: new Date().toISOString(),
    duration: '3600',
    lineLimit: '200',
    direction: 'backward',
  });

  try {
    const logs = await nfFetch<BuildLogLine[]>(
      projectApiPath(projectId, `/services/${serviceId}/build-logs?${params.toString()}`),
    );

    if (!Array.isArray(logs) || logs.length === 0) {
      console.error(`No Northflank build logs returned for ${serviceId} build ${buildId}.`);
      return;
    }

    console.error(`Last ${logs.length} Northflank build log lines for ${serviceId} build ${buildId}:`);
    for (const entry of logs) {
      const timestamp = entry.ts ? `${entry.ts} ` : '';
      console.error(redactText(`${timestamp}${entry.log ?? ''}`));
    }
  } catch (error) {
    console.error(`Could not fetch Northflank build logs for ${buildId}: ${formatError(error)}`);
  }
}

async function printFailureDiagnostics(
  projectId: string,
  serviceId: string,
  buildId: string | undefined,
  service: ServiceStatus,
): Promise<void> {
  const resolvedBuildId = await resolveBuildId(projectId, serviceId, buildId);
  const build = resolvedBuildId
    ? await fetchBuildDetails(projectId, serviceId, resolvedBuildId)
    : undefined;

  console.error(`${serviceId} failure diagnostics:`);
  console.error(
    JSON.stringify(
      redactValue({
        buildId: resolvedBuildId,
        build,
        serviceStatus: service,
      }),
      null,
      2,
    ),
  );

  if (resolvedBuildId) {
    await printBuildLogs(projectId, serviceId, resolvedBuildId);
  }
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/northflank/wait-service.ts <service-id> [--timeout-ms 900000] [--build-id <id>]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const timeoutMs = Number(argValue('--timeout-ms') || 900_000);
  const targetBuildId = argValue('--build-id');
  const start = Date.now();
  let last = '';
  let lastService: ServiceStatus | undefined;
  let lastBuild: ServiceBuild | undefined;

  console.log(`${serviceId}: Waiting for ${targetBuildId ? `build ${targetBuildId}` : 'service'}...`);

  while (Date.now() - start < timeoutMs) {
    // If tracking a specific build, fetch its status
    // Try combined endpoint first (for combined services like elevate-marketing, elevate-lms)
    if (targetBuildId) {
      let build: ServiceBuild | undefined;
      try {
        build = await nfFetch<ServiceBuild>(
          combinedServicePath(projectId, serviceId) + `/build/${targetBuildId}`,
        ).catch(() => undefined);
      } catch {
        // Fall back to single service endpoint
      }
      if (!build) {
        build = await nfFetch<ServiceBuild>(
          projectApiPath(projectId, `/services/${serviceId}/build/${targetBuildId}`),
        ).catch(() => undefined);
      }
      lastBuild = build;

      if (build) {
        const buildStatus = build.status;
        const buildSuccess = build.success;

        if (buildStatus !== last) {
          console.log(`${serviceId} build: ${buildStatus}`);
          last = buildStatus ?? '';
        }

        // Build completed successfully
        if (BUILD_DONE_STATUSES.has(buildStatus ?? '')) {
          if (buildSuccess === true) {
            console.log(`${serviceId}: build ${targetBuildId} completed successfully ✅`);
            process.exit(0);
          }
          // Build done but failed
          console.error(`${serviceId}: build ${targetBuildId} ${buildStatus} (failed)`);
          await printBuildLogs(projectId, serviceId, targetBuildId);
          process.exit(1);
        }

        // Build still in progress - wait
        if (BUILD_FAILURE_STATUSES.has(buildStatus ?? '')) {
          console.error(`${serviceId}: build failed with status ${buildStatus}`);
          await printBuildLogs(projectId, serviceId, targetBuildId);
          process.exit(1);
        }
      }
    } else {
      // Not tracking specific build - just wait for deployment
      // For combined services (elevate-marketing, elevate-lms), the deployment status might be
      // reported differently at combined vs single endpoints. Fetch both and merge.
      let service: ServiceStatus = {};
      try {
        const [combined, single] = await Promise.all([
          nfFetch<ServiceStatus>(combinedServicePath(projectId, serviceId)).catch(() => ({})),
          nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`)).catch(() => ({})),
        ]);
        // Prefer the endpoint that has actual deployment status
        const combinedDeploy = combined?.status?.deployment?.status ?? combined?.deploymentStatus?.status;
        const singleDeploy = single?.status?.deployment?.status ?? single?.deploymentStatus?.status;
        const combinedBuild = combined?.status?.build?.status ?? combined?.buildStatus;
        const singleBuild = single?.status?.build?.status ?? single?.buildStatus;
        service = {
          status: {
            deployment: combinedDeploy ? (combined.status?.deployment ?? { status: combinedDeploy }) : (single?.status?.deployment ?? single?.deploymentStatus),
            build: combinedBuild ? (combined.status?.build ?? { status: combinedBuild }) : (single?.status?.build ?? { status: singleBuild }),
          },
        };
      } catch {
        // Fall back to empty
      }
      lastService = service;

      const buildStatus = service.status?.build?.status ?? service.buildStatus;
      const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;

      if (buildStatus !== last) {
        console.log(`${serviceId}: build=${buildStatus} deploy=${deploy}`);
        last = buildStatus ?? '';
      }

      // Detect instances=0 (containers won't start — billing disabled or pod crash loop)
      // Get raw service data to check instances directly
      let instances: number | undefined;
      try {
        const rawSingle = await nfFetch<{ data?: { deployment?: { instances?: number } } }>(
          projectApiPath(projectId, `/services/${serviceId}`),
        ).catch(() => null);
        instances = rawSingle?.data?.deployment?.instances;
      } catch {
        // ignore
      }

      const deployReady = deploy && DEPLOY_READY_STATUSES.has(deploy);
      const buildDone = !buildStatus || BUILD_DONE_STATUSES.has(buildStatus);

      // KEY FIX: If instances=0 and build is done, containers won't start (billing/suspension crash).
      // Northflank won't schedule pods — polling HTTP health forever will never succeed.
      // Detect this early and exit with a clear error.
      if (instances === 0 && buildDone) {
        console.error(`${serviceId}: instances=0 (containers won't start — check billing/suspension).`);
        console.error(`Build status: ${buildStatus ?? 'unknown'}, Deployment status: ${deploy ?? 'N/A'}.`);
        process.exit(1);
      }

      // If build failed but deployment is RUNNING/COMPLETED, the old deployment is still live
      if (BUILD_FAILURE_STATUSES.has(buildStatus ?? '')) {
        if (deployReady) {
          console.log(`${serviceId}: build failed (${buildStatus}) but deployment healthy (${deploy})`);
          process.exit(0);
        }
        console.error(`${serviceId}: build failed (${buildStatus}) and deployment not ready`);
        process.exit(1);
      }

      if (buildDone && deployReady) {
        // Build and deployment status say ready. Now poll HTTP health until the new
        // container image is actually serving (health endpoint returns expected SHA).
        const expectedSha = getExpectedSha();
        if (expectedSha) {
          console.log(`${serviceId}: build/deploy ready — polling HTTP health (expecting ${expectedSha.slice(0, 7)})...`);
          // Poll the health endpoint until it returns the expected SHA or times out
          while (Date.now() - start < timeoutMs) {
            const health = await checkHttpHealth(serviceId, expectedSha);
            if (health.ok) {
              console.log(`${serviceId}: service ready ✅ (commit: ${health.currentCommit.slice(0, 7)})`);
              process.exit(0);
            }
            // Fail immediately if build identity is missing — retrying won't fix it.
            if (health.error?.includes('build identity missing')) {
              console.error(`${serviceId}: FATAL — ${health.error}`);
              process.exit(1);
            }
            console.log(`${serviceId}: health: ${health.error} — new container not ready yet, retrying in 15s...`);
            await new Promise((r) => setTimeout(r, 15000));
          }
          console.error(`${serviceId}: health check timeout after ${Math.round((Date.now() - start) / 1000)}s — new container never reached expected SHA`);
          process.exit(1);
        } else {
          console.log(`${serviceId}: service ready ✅ (no SHA to verify)`);
          process.exit(0);
        }
      }

      // KEY FIX: For combined services (elevate-marketing, elevate-lms), the Northflank API
      // often returns status: {} after trigger-deployment.ts fires, even when containers are
      // running. When the build is done but deployment status is missing, use HTTP health
      // as the readiness signal. This avoids 60-minute timeouts.
      if (buildDone && !deploy && SERVICE_HEALTH_URLS[serviceId]) {
        const expectedSha = getExpectedSha();
        console.log(`${serviceId}: build done (${buildStatus}), deployment status unknown — switching to HTTP health polling`);
        while (Date.now() - start < timeoutMs) {
          const health = await checkHttpHealth(serviceId, expectedSha);
          if (health.ok) {
            console.log(`${serviceId}: HTTP health OK ✅ (commit: ${health.currentCommit.slice(0, 7)})`);
            process.exit(0);
          }
          // Fail immediately if build identity is missing — retrying won't fix it.
          if (health.error?.includes('build identity missing')) {
            console.error(`${serviceId}: FATAL — ${health.error}`);
            process.exit(1);
          }
          console.log(`${serviceId}: health: ${health.error} — retrying in 15s...`);
          await new Promise((r) => setTimeout(r, 15000));
        }
        console.error(`${serviceId}: HTTP health check timeout after ${Math.round((Date.now() - start) / 1000)}s`);
        process.exit(1);
      }

      if (DEPLOY_FAILURE_STATUSES.has(deploy ?? '')) {
        console.error(`${serviceId}: deployment failed (${deploy})`);
        process.exit(1);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  console.error(`${serviceId}: timeout after ${timeoutMs}ms`);
  if (lastBuild) {
    console.error('Last build:', JSON.stringify(lastBuild, null, 2));
  }
  if (lastService) {
    console.error('Last service status:', JSON.stringify(lastService, null, 2));
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
