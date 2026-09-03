#!/usr/bin/env tsx
/**
 * Acquire a safe Northflank build slot and return exactly one build id.
 *
 * - Reuses an active or positively successful build for the same Git SHA.
 * - Waits for a different in-flight build instead of overlapping/canceling it.
 * - Triggers one fresh build only when the service has no competing build.
 *
 * Service configuration and build arguments are applied separately by
 * configure-services.ts. This script intentionally does not PATCH the combined
 * service because that PATCH can start an additional build.
 *
 * Usage:
 *   npx tsx scripts/northflank/trigger-build.ts <service-id>
 */

import fs from 'node:fs';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

interface NorthflankBuildResponse {
  id: string;
  status?: string;
  sha?: string;
  concluded?: boolean;
  success?: boolean;
  createdAt?: string;
}

interface NorthflankBuildList {
  builds?: NorthflankBuildResponse[];
}

const TERMINAL_STATUSES = new Set([
  'ABORTED',
  'CANCELLED',
  'CANCELED',
  'COMPLETED',
  'CRASHED',
  'ERROR',
  'FAILED',
  'FAILURE',
  'SKIPPED',
  'SUBMISSION_FAILURE',
  'SUCCESS',
]);
const POLL_MS = 15_000;
const SLOT_TIMEOUT_MS = Number(process.env.NORTHFLANK_BUILD_SLOT_TIMEOUT_MS || 3_600_000);

function normalizedStatus(build: NorthflankBuildResponse): string {
  return String(build.status || '').trim().toUpperCase();
}

function isActive(build: NorthflankBuildResponse): boolean {
  if (build.concluded === true) return false;
  const status = normalizedStatus(build);
  if (TERMINAL_STATUSES.has(status)) return false;
  return Boolean(status) || build.concluded === false;
}

function isSuccessfulForSha(build: NorthflankBuildResponse, sha: string): boolean {
  if ((build.sha || '').toLowerCase() !== sha.toLowerCase()) return false;
  if (build.success === true) return true;
  // SUCCESS is unambiguous even when the API omits the boolean. COMPLETED and
  // SKIPPED are not reused unless success=true because they can represent a
  // concluded build that did not produce a deployable artifact.
  return normalizedStatus(build) === 'SUCCESS';
}

function emitBuildId(buildId: string, reused: boolean) {
  console.log(`${reused ? 'Reusing' : 'Triggered'} Northflank build: ${buildId}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${buildId}\n`, 'utf8');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `reused_build=${reused ? 'true' : 'false'}\n`, 'utf8');
  }
}

async function listBuilds(projectId: string, serviceId: string) {
  const result = await nfFetch<NorthflankBuildList>(
    projectApiPath(projectId, `/services/${serviceId}/build?per_page=20`),
  );
  return Array.isArray(result.builds) ? result.builds : [];
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId) {
    console.error('Usage: npx tsx scripts/northflank/trigger-build.ts <service-id>');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const currentSha = process.env.GITHUB_SHA || process.env.BUILD_SHA || '';
  if (!/^[a-f0-9]{40}$/i.test(currentSha)) {
    console.error(
      `Northflank POST /build requires a full 40-character Git SHA. Received: ${currentSha || 'missing'}`,
    );
    process.exit(1);
  }

  const buildPath = projectApiPath(projectId, `/services/${serviceId}/build`);
  const started = Date.now();

  console.log('=== NORTHFLANK BUILD SLOT ===');
  console.log(`Service: ${serviceId}`);
  console.log(`SHA:     ${currentSha}`);

  while (Date.now() - started < SLOT_TIMEOUT_MS) {
    const builds = await listBuilds(projectId, serviceId);

    const sameShaActive = builds.find(
      (build) => isActive(build) && (build.sha || '').toLowerCase() === currentSha.toLowerCase(),
    );
    if (sameShaActive?.id) {
      console.log(
        `Same SHA already has an in-flight build (${normalizedStatus(sameShaActive) || 'PENDING'}); using it instead of triggering a duplicate.`,
      );
      emitBuildId(sameShaActive.id, true);
      return;
    }

    const competing = builds.find((build) => isActive(build));
    if (competing) {
      console.log(
        `Northflank build ${competing.id} (${normalizedStatus(competing) || 'PENDING'}) is still active for ${competing.sha || 'unknown SHA'}; keeping this release queued.`,
      );
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      continue;
    }

    const reusable = builds.find((build) => isSuccessfulForSha(build, currentSha));
    if (reusable?.id) {
      console.log('A successful build already exists for this exact SHA; reusing it.');
      emitBuildId(reusable.id, true);
      return;
    }

    const build = await nfFetch<NorthflankBuildResponse>(buildPath, {
      method: 'POST',
      body: JSON.stringify({
        sha: currentSha,
        no_cache: process.env.FORCE_FRESH_BUILD === 'true',
      }),
    });

    if (!build.id) {
      throw new Error(`Northflank build response did not include an id: ${JSON.stringify(build)}`);
    }

    emitBuildId(build.id, false);
    return;
  }

  throw new Error(
    `Timed out after ${SLOT_TIMEOUT_MS}ms waiting for a safe Northflank build slot for ${serviceId}. Existing builds were left untouched.`,
  );
}

main().catch((error) => {
  console.error('Build trigger failed:', error);
  process.exit(1);
});
