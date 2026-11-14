#!/usr/bin/env tsx
/**
 * Delete the duplicate "elevate-marketing-standalone" service.
 * Usage: NORTHFLANK_API_TOKEN=<token> npx tsx scripts/northflank/delete-duplicate-service.ts
 */

import { nfFetch, projectApiPath, resolveProjectId, resolveTeamId } from './lib';

async function main() {
  const projectId = resolveProjectId();
  const teamId = resolveTeamId();
  
  if (!projectId) {
    console.error('Missing NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }
  
  const serviceName = 'elevate-marketing-standalone';
  
  console.log(`Finding service "${serviceName}" in project ${projectId}...`);
  
  // List all services
  const path = teamId 
    ? `/teams/${teamId}/projects/${projectId}/services`
    : `/projects/${projectId}/services`;
  
  const services = await nfFetch<any[]>(path);
  
  console.log('Available services:');
  for (const svc of services) {
    console.log(`  - ${svc.id || svc.name}: ${JSON.stringify(svc).slice(0, 100)}`);
  }
  
  // Find the duplicate service
  const duplicate = services.find((s: any) => 
    (s.id === serviceName || s.name === serviceName)
  );
  
  if (!duplicate) {
    console.log(`Service "${serviceName}" not found. Nothing to delete.`);
    process.exit(0);
  }
  
  const serviceId = duplicate.id || serviceName;
  
  console.log(`Found service: ${JSON.stringify(duplicate, null, 2)}`);
  console.log(`\nDeleting service "${serviceId}"...`);
  
  // Delete the service
  const deletePath = teamId
    ? `/teams/${teamId}/projects/${projectId}/services/${serviceId}`
    : `/projects/${projectId}/services/${serviceId}`;
  
  try {
    await nfFetch(deletePath, { method: 'DELETE' });
    console.log(`✅ Successfully deleted service "${serviceName}"`);
  } catch (error: any) {
    console.error(`Failed to delete service: ${error.message}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
