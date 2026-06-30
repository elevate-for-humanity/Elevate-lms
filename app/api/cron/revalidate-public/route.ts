/**
 * GET /api/cron/revalidate-public
 * Bust ISR/cache for public marketing catalog pages after deploy or DB catalog changes.
 * AUTH: Enforced via withRuntime({ cron: 'bearer' }) — CRON_SECRET required.
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withRuntime } from '@/lib/api/withRuntime';
import { logger } from '@/lib/logger';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-revalidate-paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export { PUBLIC_REVALIDATE_PATHS };

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  for (const path of PUBLIC_REVALIDATE_PATHS) {
    revalidatePath(path);
  }

  logger.info('[cron/revalidate-public] revalidated paths', {
    paths: PUBLIC_REVALIDATE_PATHS,
  });

  return NextResponse.json({
    ok: true,
    revalidated: [...PUBLIC_REVALIDATE_PATHS],
    timestamp: new Date().toISOString(),
  });
});
