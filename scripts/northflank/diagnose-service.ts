#!/usr/bin/env tsx
/**
 * Print full Northflank service status (build + deployment) for post-mortems.
 *
 *   pnpm tsx scripts/northflank/diagnose-service.ts elevate-admin
 *   pnpm tsx scripts/northflank/diagnose-service.ts elevate-lms
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId) {
    console.error('Usage: pnpm tsx scripts/northflank/diagnose-service.ts <service-id>');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const service = await nfFetch<Record<string, unknown>>(
    projectApiPath(projectId, `/services/${serviceId}`),
  );

  console.log(JSON.stringify(service, null, 2));

  const status = service.status as Record<string, unknown> | undefined;
  const build = status?.build as Record<string, unknown> | undefined;
  const deployment = status?.deployment as Record<string, unknown> | undefined;

  console.log('\n--- summary ---');
  console.log(`build.status:       ${String(build?.status ?? service.buildStatus ?? 'n/a')}`);
  console.log(`deployment.status:  ${String(deployment?.status ?? (service.deploymentStatus as { status?: string })?.status ?? 'n/a')}`);
  if (deployment?.reason) console.log(`deployment.reason:  ${deployment.reason}`);
  if (build?.reason) console.log(`build.reason:       ${build.reason}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
