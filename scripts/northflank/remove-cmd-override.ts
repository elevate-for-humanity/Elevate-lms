#!/usr/bin/env tsx
/**
 * Remove CMD override from LMS service
 * 
 * This script removes any CMD override that Northflank might have set,
 * allowing the Dockerfile CMD to be used instead.
 * 
 * Usage:
 *   npx tsx scripts/northflank/remove-cmd-override.ts [--dry-run]
 */

import { nfFetch, projectApiPath, combinedServicePatchPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=== Remove CMD Override from ${serviceId} ===`);
  console.log(dryRun ? '[DRY RUN MODE]' : '[EXECUTE MODE]\n');

  try {
    // Get current service config
    console.log('Fetching current service config...');
    const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
    const service = response.data || response;

    // Check for any command overrides
    const commandOverride = service.deployment?.command ||
                            service.runtime?.command ||
                            service.config?.command;

    console.log('Current command override:', commandOverride || 'NONE');

    if (!commandOverride) {
      console.log('\n✅ No CMD override found. Dockerfile CMD will be used.');
      return;
    }

    if (dryRun) {
      console.log('\n[DRY RUN] Would remove CMD override');
      return;
    }

    // Remove the CMD override by setting it to null or undefined
    // Northflank API: PATCH with empty command array to use Dockerfile CMD
    console.log('\nRemoving CMD override...');

    const patchBody: Record<string, unknown> = {
      deployment: {
        ...service.deployment,
        command: null, // Remove override
      },
    };

    // Use combined endpoint for combined services
    const patchPath = service.serviceType === 'combined'
      ? combinedServicePatchPath(projectId, serviceId)
      : projectApiPath(projectId, `/services/${serviceId}`);

    const result = await nfFetch(patchPath, {
      method: 'PATCH',
      body: JSON.stringify(patchBody),
    });

    console.log('\n✅ CMD override removed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

    // Verify
    console.log('\nVerifying removal...');
    const verifyResponse = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
    const verifyService = verifyResponse.data || verifyResponse;
    const newCommand = verifyService.deployment?.command;

    if (newCommand) {
      console.log('⚠️ CMD override still present:', newCommand);
    } else {
      console.log('✅ CMD override confirmed removed. Dockerfile CMD will be used.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
