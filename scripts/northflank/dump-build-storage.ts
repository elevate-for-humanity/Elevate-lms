#!/usr/bin/env tsx
/** Print Northflank build storage + billing from the combined-service API (source of truth for PATCH). */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const pid = resolveProjectId();
  if (!pid) process.exit(1);
  for (const sid of ['elevate-lms', 'elevate-admin']) {
    const s = await nfFetch<Record<string, unknown>>(projectApiPath(pid, `/services/${sid}`));
    const buildSettings = s.buildSettings as Record<string, unknown> | undefined;
    const buildConfiguration = s.buildConfiguration as Record<string, unknown> | undefined;
    const billing = s.billing as Record<string, unknown> | undefined;
    const storage =
      (buildSettings?.storage as { ephemeralStorage?: { storageSize?: number } })?.ephemeralStorage
        ?.storageSize ??
      (buildConfiguration?.storage as { ephemeralStorage?: { storageSize?: number } })?.ephemeralStorage
        ?.storageSize ??
      null;
    const buildkit = (buildSettings?.dockerfile as { buildkit?: unknown })?.buildkit ?? null;
    console.log(
      JSON.stringify(
        {
          id: sid,
          deploymentPlan: billing?.deploymentPlan ?? null,
          buildPlan: billing?.buildPlan ?? null,
          ephemeralStorageMb: storage,
          buildkit,
          dockerfile: (buildSettings?.dockerfile as { dockerFilePath?: string })?.dockerFilePath ?? null,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
