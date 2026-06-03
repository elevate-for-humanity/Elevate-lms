#!/usr/bin/env tsx
/**
 * Production deploy helper: enable BuildKit cache, point services at branch, trigger builds.
 *
 *   DEPLOY_BRANCH=main pnpm tsx scripts/northflank/deploy-live.ts --execute
 *   DEPLOY_BRANCH=cursor/fix-header-mobile-desktop-c4c6 pnpm tsx scripts/northflank/deploy-live.ts --execute
 */

import { combinedServicePath, nfFetch, projectApiPath, resolveProjectId } from './lib';

async function setBranch(projectId: string, serviceId: string, branch: string) {
  await nfFetch(combinedServicePath(projectId, serviceId), {
    method: 'PATCH',
    body: JSON.stringify({ vcsData: { projectBranch: branch } }),
  });
  console.log(`Branch ${serviceId} → ${branch}`);
}

async function triggerBuild(projectId: string, serviceId: string) {
  const build = await nfFetch<{ id?: string; status?: string }>(
    projectApiPath(projectId, `/services/${serviceId}/build`),
    { method: 'POST', body: JSON.stringify({}) },
  );
  console.log(`Build ${serviceId}:`, build);
}

async function waitForRunning(projectId: string, serviceId: string, maxMs = 900_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const s = await nfFetch<{ deploymentStatus?: { status?: string }; buildStatus?: string }>(
      projectApiPath(projectId, `/services/${serviceId}`),
    );
    const st = s.deploymentStatus?.status ?? s.buildStatus ?? 'unknown';
    process.stdout.write(`\r  ${serviceId}: ${st}   `);
    if (st === 'COMPLETED' || st === 'RUNNING' || st === 'SUCCESS') {
      console.log('');
      return true;
    }
    if (st === 'FAILED' || st === 'ERROR') {
      console.log('\n  FAILED');
      return false;
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  console.log('\n  timeout waiting for deploy');
  return false;
}

async function smokeAdmin() {
  try {
    const res = await fetch('https://admin.elevateforhumanity.org/admin', {
      redirect: 'manual',
    });
    console.log(`Admin smoke: HTTP ${res.status}`);
    return res.status === 200 || res.status === 302 || res.status === 307;
  } catch (e) {
    console.log('Admin smoke failed:', e);
    return false;
  }
}

async function main() {
  const execute = process.argv.includes('--execute');
  const branch = process.env.DEPLOY_BRANCH || 'main';
  const lmsId = process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms';
  const adminId = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
  const projectId = resolveProjectId();
  if (!projectId) process.exit(1);

  console.log(execute ? '=== DEPLOY LIVE ===' : '=== DRY RUN ===');
  console.log(`Branch: ${branch}`);

  if (!execute) {
    console.log('Would: ensure-build-cache, set branches, trigger builds, wait, smoke admin');
    process.exit(0);
  }

  const { execSync } = await import('node:child_process');
  execSync('pnpm exec tsx scripts/northflank/ensure-build-cache.ts --execute', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  await setBranch(projectId, lmsId, branch);
  await setBranch(projectId, adminId, branch);

  await triggerBuild(projectId, lmsId);
  await triggerBuild(projectId, adminId);

  const lmsOk = await waitForRunning(projectId, lmsId);
  const adminOk = await waitForRunning(projectId, adminId);

  const smoke = await smokeAdmin();
  console.log('\n--- Summary ---');
  console.log(`LMS deploy: ${lmsOk ? 'ok' : 'check Northflank UI'}`);
  console.log(`Admin deploy: ${adminOk ? 'ok' : 'check Northflank UI'}`);
  console.log(`Admin HTTPS smoke: ${smoke ? 'ok' : 'failed'}`);
  process.exit(adminOk && smoke ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
