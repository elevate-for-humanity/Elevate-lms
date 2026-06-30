/**
 * GET /api/cron/revalidate-public
 * Bust ISR/cache for public marketing catalog pages after deploy or DB catalog changes.
 * AUTH: Enforced via withRuntime({ cron: 'bearer' }) — CRON_SECRET required.
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withRuntime } from '@/lib/api/withRuntime';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** All public marketing routes that must not serve stale program counts or SEO. */
export const PUBLIC_REVALIDATE_PATHS = [
  '/',
  '/programs',
  '/programs/catalog',
  '/programs/healthcare',
  '/programs/skilled-trades',
  '/programs/technology',
  '/education',
  '/career-training',
  '/impact',
  '/funding',
  '/apply',
  '/enrollment',
  '/about',
  '/contact',
] as const;

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
