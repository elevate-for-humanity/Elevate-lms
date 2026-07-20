#!/usr/bin/env tsx
/**
 * Comprehensive audit of all Northflank services
 */

import { nfFetch, projectApiPath } from './lib';

const TOKEN = process.env.NORTHFLANK_API_TOKEN || 'nf-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiNjg3MjM0ZDktNDk3Yi00YTM2LTg2ZmMtZTQ3Yzk5ZjllNDI1IiwiZW50aXR5SWQiOiI2YTFlOWEzM2RhNmU0NzJkYTY1NTFjMDciLCJlbnRpdHlUeXBlIjoidGVhbSIsInRva2VuSWQiOiI2YTJlNzMyYzkwMDc1ODI0YjNkNmRhYjEiLCJ0b2tlbkludGVybmFsSWQiOiJlbGl6YWJldGgtZ3JlZW5lIiwicm9sZUlkIjoiNmExZTlhMzNkYTZlNDcyZGE2NTUxYzA4Iiwicm9sZUVudGl0eUlkIjoiNmExZTlhMzNkYTZlNDcyZGE2NTUxYzA3Iiwicm9sZUVudGl0eVR5cGUiOiJ0ZWFtIiwicm9sZUludGVybmFsSWQiOiJvd25lciIsInR5cGUiOiJyYmFjIiwiaWF0IjoxNzgxNDI5MDM2fQ.T376YufcueMqGbxXADuJoeqCskZWVnFCR0shHoy_2Lk';

async function auditService(serviceId: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SERVICE: ${serviceId.toUpperCase()}`);
  console.log('='.repeat(60));

  const response = await nfFetch<any>(projectApiPath('elevate-platform', `/services/${serviceId}`));
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

  console.log('\n--- CMD Override Check ---');
  const cmdOverride = s.deployment?.command ||
                      s.runtime?.command ||
                      s.config?.command ||
                      s.deployment?.commands ||
                      s.runtime?.commands;
  console.log(`CMD Override: ${cmdOverride ? JSON.stringify(cmdOverride) : 'NONE'}`);

  console.log('\n--- Health Checks ---');
  console.log(JSON.stringify(s.healthChecks || 'Not configured', null, 2));

  console.log('\n--- All Config Keys ---');
  if (s.deployment) console.log('deployment keys:', Object.keys(s.deployment).join(', '));
  if (s.runtime) console.log('runtime keys:', Object.keys(s.runtime).join(', '));
  if (s.config) console.log('config keys:', Object.keys(s.config).join(', '));
}

async function main() {
  const services = ['elevate-lms', 'elevate-admin', 'elevate-marketing'];
  
  console.log('# NORTHFLANK PRODUCTION CONFIGURATION PARITY AUDIT');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Commit: ${require('child_process').execSync('git rev-parse HEAD').toString().trim()}`);

  for (const service of services) {
    try {
      await auditService(service);
    } catch (e) {
      console.error(`Error auditing ${service}:`, e);
    }
  }
}

main();
