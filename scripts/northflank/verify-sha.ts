#!/usr/bin/env tsx
/**
 * Verify that the deployed Northflank service matches the expected git SHA.
 * This prevents old builds from being served due to caching or deployment issues.
 *
 * Usage:
 *   npx tsx scripts/northflank/verify-sha.ts elevate-marketing
 *   npx tsx scripts/northflank/verify-sha.ts elevate-marketing --sha abc123
 *   npx tsx scripts/northflank/verify-sha.ts elevate-marketing --url https://www.example.com
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function getDeployedSHA(projectId: string, serviceId: string): Promise<string | null> {
  try {
    const service = await nfFetch<{
      deployment?: {
        internal?: {
          deployedSHA?: string;
          sha?: string;
          buildSHA?: string;
        };
      };
      build?: {
        sha?: string;
        commit?: string;
      };
    }>(projectApiPath(projectId, `/services/${serviceId}`));

    const deployedSha =
      service.deployment?.internal?.deployedSHA ||
      service.deployment?.internal?.sha ||
      service.deployment?.internal?.buildSHA ||
      service.build?.sha ||
      service.build?.commit;

    return deployedSha || null;
  } catch (error) {
    console.error(`Failed to get deployed SHA for ${serviceId}:`, error);
    return null;
  }
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/northflank/verify-sha.ts <service-id> [--sha <sha>] [--url <url>]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const expectedSha = argValue('--sha') || process.env.GITHUB_SHA || '';
  const checkUrl = argValue('--url');
  const skipIfUnavailable = argValue('--skip-if-unavailable') !== undefined;

  console.log(`\n=== SHA Verification for ${serviceId} ===`);

  if (expectedSha) {
    console.log(`Expected SHA: ${expectedSha}`);
  } else {
    console.log('Warning: No expected SHA provided, will only report deployed SHA');
  }

  // Get deployed SHA from Northflank API
  const deployedSha = await getDeployedSHA(projectId, serviceId);

  console.log(`\nDeployed SHA (from Northflank API): ${deployedSha || 'UNKNOWN'}`);

  if (!expectedSha) {
    console.log('\n⚠️  No expected SHA to compare against');
    console.log('Set GITHUB_SHA or pass --sha to verify');
    process.exit(0);
  }

  if (!deployedSha) {
    if (skipIfUnavailable) {
      console.log('\n⚠️  Could not determine deployed SHA, skipping verification');
      console.log('(Use --skip-if-unavailable to skip when SHA is not available)');
      process.exit(0);
    }
    console.error('\n❌ FAILED: Could not determine deployed SHA from Northflank');
    console.error('   Pass --skip-if-unavailable to skip when SHA is not available');
    process.exit(1);
  }

  // Compare SHAs (allow partial match - first 8 chars)
  const shortExpected = expectedSha.substring(0, 8);
  const shortDeployed = deployedSha.substring(0, 8);

  if (deployedSha === expectedSha || shortDeployed === shortExpected) {
    console.log(`\n✅ SHA VERIFIED: Deployed matches expected`);
    console.log(`   Expected: ${expectedSha}`);
    console.log(`   Deployed: ${deployedSha}`);
    process.exit(0);
  } else {
    console.error(`\n❌ SHA MISMATCH: Deployed does NOT match expected!`);
    console.error(`   Expected: ${expectedSha}`);
    console.error(`   Deployed: ${deployedSha}`);
    console.error(`\n   This means an OLD build is being served!`);
    console.error(`   Check Northflank dashboard for the correct service.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
