#!/usr/bin/env tsx
/**
 * Configure elevate-marketing service to use correct Dockerfile and port
 * Usage: NORTHFLANK_API_TOKEN=<token> NORTHFLANK_PROJECT_ID=<id> npx tsx scripts/northflank/configure-marketing.ts
 */

import { nfFetch, projectApiPath, resolveProjectId, resolveTeamId } from './lib';

async function main() {
  const projectId = resolveProjectId();
  const teamId = resolveTeamId();
  
  if (!projectId) {
    console.error('Missing NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }
  
  const serviceId = 'elevate-marketing';
  
  console.log(`Configuring service "${serviceId}" in project ${projectId}...`);
  
  // First, get current service configuration
  const path = teamId 
    ? `/teams/${teamId}/projects/${projectId}/services/${serviceId}`
    : `/projects/${projectId}/services/${serviceId}`;
  
  const service = await nfFetch<any>(path);
  console.log('Current service config:', JSON.stringify(service, null, 2));
  
  // Update Dockerfile path
  console.log('\nUpdating Dockerfile path to /Dockerfile.marketing...');
  await nfFetch(`${path}/build`, {
    method: 'PATCH',
    body: JSON.stringify({
      vcsData: {
        dockerFilePath: '/Dockerfile.marketing',
        dockerWorkDir: '/'
      }
    })
  });
  console.log('✓ Dockerfile path updated');
  
  // Update health check port to 3000
  console.log('\nUpdating health check port to 3000...');
  await nfFetch(`${path}/health-check`, {
    method: 'PATCH',
    body: JSON.stringify({
      healthCheck: {
        enabled: true,
        path: '/api/ping',
        port: 3000,
        protocol: 'HTTP',
        initialDelaySeconds: 60,
        periodSeconds: 10,
        timeoutSeconds: 5,
        failureThreshold: 3
      }
    })
  });
  console.log('✓ Health check updated');
  
  // Verify the changes
  console.log('\nVerifying configuration...');
  const updated = await nfFetch<any>(path);
  console.log('Updated service config:', JSON.stringify(updated, null, 2));
  
  console.log('\n✅ Marketing service configured correctly!');
  console.log('   Dockerfile: /Dockerfile.marketing');
  console.log('   Port: 3000');
  console.log('   Health check: /api/ping');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
