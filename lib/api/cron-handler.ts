/**
 * cronHandler — standard wrapper for all /api/cron/* routes.
 *
 * Provides:
 *   - CRON_SECRET header validation (same as withRuntime({ cron: true }))
 *   - Structured logging with job name, duration, result
 *   - Consistent JSON response shape: { ok, job, duration_ms, ...result }
 *   - Unhandled error catch with logger.error
 *
 * Usage:
 *   export const GET = cronHandler('job-name', async (db) => {
 *     // do work
 *     return { processed: 5 };
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';

export function cronHandler(
  jobName: string,
  fn: (db: Awaited<ReturnType<typeof requireAdminClient>>, req: NextRequest) => Promise<Record<string, unknown>>,
) {
  return async function handler(req: NextRequest): Promise<NextResponse> {
    await hydrateProcessEnv();

    const secret = process.env.CRON_SECRET;
    const provided =
      req.headers.get('authorization')?.replace('Bearer ', '') ??
      req.headers.get('x-cron-secret') ??
      '';

    if (!secret || provided !== secret) {
      logger.warn(`[cron/${jobName}] Unauthorized attempt`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();
    logger.info(`[cron/${jobName}] Starting`);

    try {
      const db = await requireAdminClient();
      const result = await fn(db, req);
      const duration_ms = Date.now() - start;
      logger.info(`[cron/${jobName}] Completed`, { duration_ms, ...result });
      return NextResponse.json({ ok: true, job: jobName, duration_ms, ...result });
    } catch (err) {
      const duration_ms = Date.now() - start;
      logger.error(`[cron/${jobName}] Failed`, { duration_ms, error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json(
        { ok: false, job: jobName, duration_ms, error: err instanceof Error ? err.message : 'Internal error' },
        { status: 500 },
      );
    }
  };
}
