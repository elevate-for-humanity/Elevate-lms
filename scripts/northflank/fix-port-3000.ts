#!/usr/bin/env tsx
/**
 * Fix all 3 services to use PORT=3000
 * 
 * Issues found:
 * 1. All services have internalPort: 8080 (should be 3000)
 * 2. LMS/Admin have PORT=8080 env (should be 3000)
 * 3. LMS/Admin have SERVICE_ROLE (should be SERVICE_NAME)
 * 4. Marketing missing runtime env vars
 * 5. Marketing CI disabled
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const TOKEN = process.env.NORTHFLANK_API_TOKEN;
if (!TOKEN) {
  console.error('Missing NORTHFLANK_API_TOKEN');
  process.exit(1);
}

const projectId = resolveProjectId() || 'elevate-platform';
const basePath = `/teams/elevates-team/projects/${projectId}`;

async function patchService(serviceId: string, body: any) {
  const path = `${basePath}/services/${serviceId}`;
  console.log(`\n📝 Patching ${serviceId}...`);
  
  const result = await nfFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  
  console.log(`✅ ${serviceId} patched`);
  return result;
}

async function main() {
  console.log('🔧 Fixing Northflank Services to use PORT=3000\n');

  // 1. Fix Marketing
  await patchService('elevate-marketing', {
    ports: [{
      name: 'site',
      internalPort: 3000,
      protocol: 'HTTP',
      public: true,
    }],
    runtimeEnvironment: {
      'PORT': '3000',
      'HOSTNAME': '0.0.0.0',
      'NODE_ENV': 'production',
      'NEXT_TELEMETRY_DISABLED': '1',
      'SERVICE_NAME': 'elevate-marketing',
    },
    disabledCI: false,
  });

  // 2. Fix LMS
  await patchService('elevate-lms', {
    ports: [{
      name: 'site',
      internalPort: 3000,
      protocol: 'HTTP',
      public: true,
    }],
    runtimeEnvironment: {
      'PORT': '3000',
      'HOSTNAME': '0.0.0.0',
      'NODE_ENV': 'production',
      'NEXT_TELEMETRY_DISABLED': '1',
      'SERVICE_NAME': 'elevate-lms',
    },
    disabledCI: false,
  });

  // 3. Fix Admin
  await patchService('elevate-admin', {
    ports: [{
      name: 'site',
      internalPort: 3000,
      protocol: 'HTTP',
      public: true,
    }],
    runtimeEnvironment: {
      'PORT': '3000',
      'HOSTNAME': '0.0.0.0',
      'NODE_ENV': 'production',
      'NEXT_TELEMETRY_DISABLED': '1',
      'SERVICE_NAME': 'elevate-admin',
    },
    disabledCI: false,
  });

  console.log('\n✅ All services updated to PORT=3000');
  console.log('\n⚠️  IMPORTANT: You must rebuild each service in Northflank UI for changes to take effect.');
}

main().catch(console.error);
