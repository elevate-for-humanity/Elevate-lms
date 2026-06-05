#!/usr/bin/env tsx
/**
 * Apply build ephemeral storage (fixes ERR_PNPM_ENOSPC when unset / 0 MB).
 *
 *   NORTHFLANK_EPHEMERAL_STORAGE_MB=32768 pnpm tsx scripts/northflank/patch-ephemeral-storage.ts elevate-admin --execute
 *   pnpm tsx scripts/northflank/patch-ephemeral-storage.ts --all --execute
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';
import { resolveTargetServiceIds } from './service-targets';

const STORAGE_MB = Number(process.env.NORTHFLANK_EPHEMERAL_STORAGE_MB || 65536);

const storagePatch = {
  buildSettings: {
    storage: { ephemeralStorage: { storageSize: STORAGE_MB } },
  },
  buildConfiguration: {
    storage: { ephemeralStorage: { storageSize: STORAGE_MB } },
  },
};

async function tryPatch(label: string, path: string, dryRun: boolean) {
  console.log(`${dryRun ? '[dry-run]' : '[patch]'} ${label}: ${path} → ${STORAGE_MB}MB`);
  if (dryRun) return true;
  try {
    await nfFetch(path, { method: 'PATCH', body: JSON.stringify(storagePatch) });
    return true;
  } catch (e) {
    console.log('  FAIL:', e instanceof Error ? e.message.slice(0, 200) : e);
    return false;
  }
}

async function tryBuildOptions(label: string, path: string, dryRun: boolean) {
  const body = {
    storage: { ephemeralStorage: { storageSize: STORAGE_MB } },
  };
  console.log(`${dryRun ? '[dry-run]' : '[post]'} ${label}: ${path} → ${STORAGE_MB}MB`);
  if (dryRun) return true;
  try {
    await nfFetch(path, { method: 'POST', body: JSON.stringify(body) });
    return true;
  } catch (e) {
    console.log('  FAIL:', e instanceof Error ? e.message.slice(0, 200) : e);
    return false;
  }
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const pid = resolveProjectId();
  if (!pid) process.exit(1);

  const services = resolveTargetServiceIds();
  console.log(`Targets: ${services.join(', ')}`);

  for (const sid of services) {
    const attempts: Array<[string, string, 'patch' | 'build-options']> = [
      ['PATCH combined', projectApiPath(pid, `/services/combined/${sid}`), 'patch'],
      ['PATCH team', projectApiPath(pid, `/services/${sid}`), 'patch'],
      ['POST build-options team', projectApiPath(pid, `/services/${sid}/build-options`), 'build-options'],
    ];

    let ok = false;
    for (const [label, path, kind] of attempts) {
      if (kind === 'patch') {
        ok = await tryPatch(label, path, dryRun);
      } else {
        ok = await tryBuildOptions(label, path, dryRun);
      }
      if (ok) break;
    }
    if (!ok && !dryRun) process.exit(1);
  }

  if (!dryRun) {
    console.log('\nDone. Verify: pnpm tsx scripts/northflank/inspect-services.ts');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
