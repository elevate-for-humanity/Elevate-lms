#!/usr/bin/env tsx
/**
 * Wait for a Northflank service deployment/build to settle.
 *
 * Usage:
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-admin
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-lms --timeout-ms 1200000
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-admin --build-id <id>
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

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
const DEPLOY_READY_STATUSES = new Set(['COMPLETED', 'RUNNING', 'SUCCESS']);
const DEPLOY_FAILURE_STATUSES = new Set(['FAILED', 'ERROR']);

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
    console.error('Usage: pnpm tsx scripts/northflank/wait-service.ts <service-id> [--timeout-ms 900000] [--build-id <id>]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const timeoutMs = Number(argValue('--timeout-ms') || 900_000);
  const buildId = argValue('--build-id');
  const start = Date.now();
  let last = '';
  let lastService: ServiceStatus | undefined;

  while (Date.now() - start < timeoutMs) {
    const service = await nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`));
    lastService = service;
    const build = service.status?.build?.status ?? service.buildStatus;
    const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;
    const phase = resolveServicePhase(service);
    const label =
      build && deploy && build !== deploy ? `${build} (deploy: ${deploy})` : phase;

    if (label !== last) {
      console.log(`${serviceId}: ${label}`);
      last = label;
    }

    if (BUILD_FAILURE_STATUSES.has(build ?? '')) {
      console.error(`${serviceId} build failed (${build})`);
      await printFailureDiagnostics(projectId, serviceId, buildId, service);
      process.exit(1);
    }

    const deployReady = deploy && DEPLOY_READY_STATUSES.has(deploy);
    const buildDone = !build || BUILD_DONE_STATUSES.has(build);

    if (buildDone && deployReady) {
      return;
    }

    if (DEPLOY_FAILURE_STATUSES.has(deploy ?? '')) {
      console.error(`${serviceId} deployment failed (${deploy})`);
      await printFailureDiagnostics(projectId, serviceId, buildId, service);
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  console.error(`${serviceId} did not settle within ${timeoutMs}ms`);
  if (lastService) {
    await printFailureDiagnostics(projectId, serviceId, buildId, lastService);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
