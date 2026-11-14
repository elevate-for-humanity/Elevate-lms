#!/usr/bin/env tsx
/**
 * Wait for a Northflank build to complete before triggering deployment.
 * This prevents "Build not found" errors when deploying before build finishes.
 *
 * Usage:
 *   npx tsx scripts/northflank/wait-build.ts elevate-admin --build-id <id>
 *   npx tsx scripts/northflank/wait-build.ts elevate-admin --build-id <id> --timeout-ms 900000
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

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

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/northflank/wait-build.ts <service-id> [--build-id <id>] [--timeout-ms 900000]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const buildId = argValue('--build-id');
  if (!buildId) {
    console.error('ERROR: --build-id is required');
    console.error('Usage: npx tsx scripts/northflank/wait-build.ts <service-id> --build-id <id>');
    process.exit(1);
  }

  const timeoutMs = Number(argValue('--timeout-ms') || 900_000);
  const start = Date.now();
  let lastStatus = '';
  let lastBuild: ServiceBuild | undefined;

  console.log(`Waiting for ${serviceId} build ${buildId} to complete...`);

  while (Date.now() - start < timeoutMs) {
    const build = await nfFetch<ServiceBuild>(
      projectApiPath(projectId, `/services/${serviceId}/build/${buildId}`),
    ).catch((e) => {
      console.error(`Error fetching build ${buildId}: ${formatError(e)}`);
      return undefined;
    });

    if (!build) {
      // Build might not exist yet, wait and retry
      console.log('Build not found yet, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      continue;
    }

    lastBuild = build;
    const buildStatus = build.status;
    const buildSuccess = build.success;

    if (buildStatus !== lastStatus) {
      console.log(`${serviceId} build status: ${buildStatus}`);
      lastStatus = buildStatus ?? '';
    }

    // Build completed successfully
    if (BUILD_DONE_STATUSES.has(buildStatus ?? '')) {
      if (buildSuccess === true) {
        console.log(`✅ Build ${buildId} completed successfully!`);
        return;
      }
      // Build done but failed
      console.error(`❌ Build ${buildId} ${buildStatus} (failed)`);
      await printBuildLogs(projectId, serviceId, buildId);
      process.exit(1);
    }

    // Build still in progress - wait
    if (BUILD_FAILURE_STATUSES.has(buildStatus ?? '')) {
      console.error(`❌ Build ${buildId} failed with status ${buildStatus}`);
      await printBuildLogs(projectId, serviceId, buildId);
      process.exit(1);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  console.error(`⏱️  Timeout after ${timeoutMs}ms waiting for build ${buildId}`);
  if (lastBuild) {
    console.error('Last build status:', JSON.stringify(lastBuild, null, 2));
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
