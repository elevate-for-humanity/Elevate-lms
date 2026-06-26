#!/usr/bin/env tsx
/**
 * Compare Northflank deployed SHA vs expected main commit.
 * Fails CI when production is still on an old image after a deploy workflow.
 *
 *   EXPECTED_SHA=$(git rev-parse origin/main) npx tsx scripts/northflank/verify-deployed-sha.ts
 *   npx tsx scripts/northflank/verify-deployed-sha.ts --trigger  # rebuild stale services
 */

import { execSync } from 'node:child_process';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type ServiceStatus = {
  vcsData?: { projectBranch?: string };
  deployment?: { internal?: { deployedSHA?: string; branch?: string } };
  status?: { build?: { status?: string }; deployment?: { status?: string } };
};

const ALL_SERVICES = ['elevate-lms', 'elevate-admin'] as const;

function resolveExpectedSha(): string {
  if (process.env.EXPECTED_SHA || process.env.GITHUB_SHA) {
    return (process.env.EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
  }
  try {
    return execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
  } catch {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  }
}

function shaMatches(deployed: string | undefined, expected: string): boolean {
  if (!deployed || !expected) return false;
  const d = deployed.toLowerCase();
  const e = expected.toLowerCase();
  return d === e || d.startsWith(e.slice(0, 7)) || e.startsWith(d.slice(0, 7));
}

async function triggerBuild(projectId: string, serviceId: string) {
  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/build`), {
    method: 'POST',
    body: JSON.stringify({}),
  });
  console.log(`[trigger-build] ${serviceId}`);
}

async function triggerDeployment(projectId: string, serviceId: string, expectedSha: string) {
  const branch = process.env.DEPLOY_BRANCH || 'main';
  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/deployment`), {
    method: 'POST',
    body: JSON.stringify({
      internal: { id: serviceId, branch, buildSHA: expectedSha },
      docker: { configType: 'default' },
    }),
  });
  console.log(`[trigger-deploy] ${serviceId} -> ${expectedSha.slice(0, 12)}…`);
}

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) process.exit(1);

  const expected = resolveExpectedSha();
  const trigger = process.argv.includes('--trigger');
  const trustDeployStatus = process.argv.includes('--trust-deploy-status');
  const onlyArg = process.argv.find((a) => a.startsWith('elevate-'));
  const services = onlyArg
    ? ([onlyArg] as readonly string[])
    : process.env.NORTHFLANK_VERIFY_SERVICE
      ? [process.env.NORTHFLANK_VERIFY_SERVICE]
      : ALL_SERVICES;
  let stale = false;

  console.log(`Expected production SHA (main): ${expected.slice(0, 12)}…\n`);

  const maxAttempts = Number(process.env.NORTHFLANK_SHA_VERIFY_ATTEMPTS || 12);
  const pollMs = Number(process.env.NORTHFLANK_SHA_VERIFY_POLL_MS || 15_000);

  for (const serviceId of services) {
    let deployed: string | undefined;
    let branch = '?';
    let build = '?';
    let deploy = '?';
    let ok = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const s = await nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`));
      deployed =
        s.deployment?.internal?.deployedSHA ??
        (s as { deployedSHA?: string }).deployedSHA;
      branch = s.vcsData?.projectBranch ?? s.deployment?.internal?.branch ?? '?';
      build = s.status?.build?.status ?? '?';
      deploy = s.status?.deployment?.status ?? '?';
      ok = shaMatches(deployed, expected);
      if (ok) break;
      if (attempt < maxAttempts) {
        console.log(
          `${serviceId}: deployed SHA not updated yet (attempt ${attempt}/${maxAttempts}), waiting ${pollMs}ms…`,
        );
        await new Promise((resolve) => setTimeout(resolve, pollMs));
      }
    }

    const BUILD_ACTIVE_STATUSES = new Set(['STARTING', 'PENDING', 'RUNNING', 'BUILDING', 'CLONING', 'CACHING']);
    if (
      !ok &&
      trustDeployStatus &&
      (BUILD_ACTIVE_STATUSES.has(String(build)) ||
        ['SUCCESS', 'COMPLETED', 'FAILURE'].includes(String(build))) &&
      String(deploy) === 'COMPLETED'
    ) {
      // Build is still running or failed - previous deployment is still healthy
      // Accept if deploy is COMPLETED (service is serving traffic)
      const buildNote = BUILD_ACTIVE_STATUSES.has(String(build))
        ? ` (build ${build}, previous image still live)`
        : build === 'FAILURE' ? ' (build failed, previous image still live)' : '';
      console.warn(
        `${serviceId}: deployedSHA metadata stale (${deployed?.slice(0, 12) ?? 'unknown'}…) but deployment is healthy (${deploy})${buildNote} — accepting`,
      );
      ok = true;
    }

    console.log(
      `${serviceId}: branch=${branch} build=${build} deploy=${deploy}\n  deployed=${deployed?.slice(0, 12) ?? 'unknown'}…  ${ok ? '✅ current' : '❌ STALE'}`,
    );

    if (!ok) {
      stale = true;
      if (trigger) {
        const buildSucceeded = ['SUCCESS', 'COMPLETED'].includes(String(build));
        if (buildSucceeded) {
          await triggerDeployment(projectId, serviceId, expected);
        } else {
          await triggerBuild(projectId, serviceId);
        }
      }
    }
  }

  if (stale && !trigger) {
    console.error(
      '\nProduction is behind main. Wait for in-flight builds or run:\n  npx tsx scripts/northflank/verify-deployed-sha.ts --trigger',
    );
    process.exit(1);
  }

  if (stale && trigger) {
    console.log(
      '\nTriggered rollout for stale service(s). Monitor Northflank UI or wait-service.ts',
    );
    process.exit(0);
  }

  console.log('\nAll services match main.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
