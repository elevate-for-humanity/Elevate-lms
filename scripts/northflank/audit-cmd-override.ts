#!/usr/bin/env tsx
/**
 * Audit CMD override for LMS service
 * 
 * Usage:
 *   npx tsx scripts/northflank/audit-cmd-override.ts
 */

import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms';

async function main() {
  console.log('=== LMS Service CMD Override Audit ===\n');

  try {
    // Get full service config
    const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
    const service = response.data || response;

    console.log('Service:', serviceId);
    console.log('Service Type:', service.serviceType);

    console.log('\n--- Dockerfile Config ---');
    console.log('dockerFilePath:', service.buildSettings?.dockerfile?.dockerFilePath);
    console.log('dockerWorkDir:', service.buildSettings?.dockerfile?.dockerWorkDir);

    console.log('\n--- Deployment Config ---');
    console.log(JSON.stringify(service.deployment, null, 2));

    console.log('\n--- Build Settings ---');
    console.log(JSON.stringify(service.buildSettings, null, 2));

    console.log('\n--- Runtime Config ---');
    console.log(JSON.stringify(service.runtime, null, 2));

    // Check for command override in all possible locations
    console.log('\n========== CMD OVERRIDE ANALYSIS ==========');
    
    const locations = [
      { path: 'command', value: service.command },
      { path: 'deployment.command', value: service.deployment?.command },
      { path: 'deployment.commands', value: service.deployment?.commands },
      { path: 'deployment.runtime.command', value: service.deployment?.runtime?.command },
      { path: 'deployment.runtime.commands', value: service.deployment?.runtime?.commands },
      { path: 'deployment.runCommand', value: service.deployment?.runCommand },
      { path: 'runtime.command', value: service.runtime?.command },
      { path: 'runtime.commands', value: service.runtime?.commands },
      { path: 'config.command', value: service.config?.command },
      { path: 'config.commands', value: service.config?.commands },
    ];

    let foundOverride = false;
    for (const loc of locations) {
      if (loc.value !== undefined && loc.value !== null) {
        console.log(`\n⚠️ FOUND: ${loc.path}`);
        console.log(`   Value: ${JSON.stringify(loc.value)}`);
        foundOverride = true;
      }
    }

    if (!foundOverride) {
      console.log('\n✅ No CMD override found');
    }

    console.log('\n--- All Top-Level Keys ---');
    console.log(Object.keys(service).join(', '));

    if (service.deployment) {
      console.log('\n--- Deployment Keys ---');
      console.log(Object.keys(service.deployment).join(', '));
    }

    if (service.runtime) {
      console.log('\n--- Runtime Keys ---');
      console.log(Object.keys(service.runtime).join(', '));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
