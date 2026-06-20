/**
 * POST /api/cron/memory-cleanup
 *
 * Deletes ai_operator_memory rows whose expires_at has passed.
 * Calls the cleanup_expired_ai_memory() DB function defined in
 * supabase/migrations/20260702000005_ai_memory_ttl.sql.
 *
 * Scheduled: daily at 2 AM UTC via cron-scheduler.yml.
 */
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await hydrateProcessEnv();
    const db = await requireAdminClient();

    const { data, error } = await db.rpc('cleanup_expired_ai_memory');

    if (error) {
      logger.error('[cron/memory-cleanup] RPC error', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const deleted = (data as number) ?? 0;
    logger.info('[cron/memory-cleanup] complete', { deleted });
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    logger.error('[cron/memory-cleanup] unexpected error', err as Error);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export const POST = withRuntime(withApiAudit('/api/cron/memory-cleanup', _POST));
