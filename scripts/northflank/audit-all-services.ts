#!/usr/bin/env tsx
/** Comprehensive read-only audit of all Northflank production services. */

import { execSync } from 'node:child_process';
import { nfFetch, projectApiPath } from './lib';

if (!process.env.NORTHFLANK_API_TOKEN) {
  console.error('NORTHFLANK_API_TOKEN is required.');
  process.exit(1);
}

const projectId = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';

async function auditService(serviceId: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SERVICE: ${serviceId.toUpperCase()}`);
  console.log('='.repeat(60));

  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const s = response.data || response;

  console.log('\n--- VCS / Dockerfile ---');
  console.log(`Dockerfile: ${s.vcsData?.dockerFilePath || 'N/A'}`);
  console.log(`WorkDir: ${s.vcsData?.dockerWorkDir || 'N/A'}`);
  console.log('\n--- Build ---');
  console.log(`Build Status: ${s.status?.build?.status || 'N/A'}`);
  console.log(`Deployed SHA: ${s.deployment?.internal?.deployedSHA || 'N/A'}`);
  console.log(`Build SHA: ${s.deployment?.internal?.buildSHA || 'N/A'}`);
  console.log('\n--- Runtime Environment ---');
  console.log(`PORT: ${s.runtimeEnvironment?.PORT || 'N/A'}`);
  console.log(`HOSTNAME: ${s.runtimeEnvironment?.HOSTNAME || 'N/A'}`);
  console.log(`NODE_ENV: ${s.runtimeEnvironment?.NODE_ENV || 'N/A'}`);
  console.log(`BUILD_SCOPE: ${s.runtimeEnvironment?.BUILD_SCOPE || 'N/A'}`);
  console.log('\n--- Deployment ---');
  console.log(`Instances: ${s.deployment?.instances || 'N/A'}`);
  console.log(`Region: ${s.deployment?.region || 'N/A'}`);

  const cmdOverride = s.deployment?.command || s.runtime?.command || s.config?.command || s.deployment?.commands || s.runtime?.commands;
  console.log('\n--- CMD Override Check ---');
  console.log(`CMD Override: ${cmdOverride ? JSON.stringify(cmdOverride) : 'NONE'}`);
  console.log('\n--- Health Checks ---');
  console.log(JSON.stringify(s.healthChecks || 'Not configured', null, 2));
}

async function main() {
  const services = ['elevate-lms', 'elevate-admin', 'elevate-marketing'];
  console.log('# NORTHFLANK PRODUCTION CONFIGURATION PARITY AUDIT');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Commit: ${execSync('git rev-parse HEAD').toString().trim()}`);

  let failures = 0;
  for (const service of services) {
    try {
      await auditService(service);
    } catch (error) {
      failures += 1;
      console.error(`Error auditing ${service}:`, error instanceof Error ? error.message : String(error));
    }
  }
  if (failures) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
