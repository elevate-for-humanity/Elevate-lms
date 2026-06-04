#!/usr/bin/env tsx
/**
 * Tail Northflank build or runtime logs (for post-mortems when CI says FAILURE).
 *
 *   pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin
 *   pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --runtime
 *   pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --grep ENOSPC
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type LogRow = { log?: string; ts?: string };

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error(
      'Usage: pnpm tsx scripts/northflank/fetch-build-logs.ts <service-id> [--runtime] [--grep text] [--lines 80]',
    );
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const runtime = process.argv.includes('--runtime');
  const grep = argValue('--grep');
  const lineLimit = Number(argValue('--lines') || 80);
  const kind = runtime ? 'logs' : 'build-logs';

  const params = new URLSearchParams({
    queryType: 'range',
    lineLimit: String(lineLimit),
    direction: 'backward',
  });
  if (grep) params.set('textIncludes', grep);

  const rows = await nfFetch<LogRow[]>(
    projectApiPath(projectId, `/services/${serviceId}/${kind}?${params}`),
  );

  const arr = Array.isArray(rows) ? rows : [];
  if (!arr.length) {
    console.log(`(no ${kind} lines${grep ? ` matching "${grep}"` : ''})`);
    return;
  }

  for (const row of [...arr].reverse()) {
    const line = row.log ?? JSON.stringify(row);
    console.log(line);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
