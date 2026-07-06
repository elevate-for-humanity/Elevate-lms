/**
 * GET /api/cron/stale-applications
 * Archive applications that have been in 'submitted' status for > 30 days with no action.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCHIVE_DAYS = 30;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - ARCHIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: stale, error } = await db
    .from('applications')
    .select('id, applicant_name, program_name, created_at')
    .eq('status', 'submitted')
    .lt('updated_at', cutoff)
    .limit(100);

  if (error) {
    logger.error('[cron/stale-applications] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!stale?.length) {
    return NextResponse.json({ ok: true, archived: 0 });
  }

  const ids = stale.map(a => a.id);
  const { error: archiveErr, count: archived } = await db
    .from('applications')
    .update({ status: 'archived', archived_reason: 'no_action_30_days', updated_at: new Date().toISOString() })
    .in('id', ids);

  if (archiveErr) {
    logger.error('[cron/stale-applications] Archive failed', archiveErr);
    return NextResponse.json({ ok: false, error: archiveErr.message }, { status: 500 });
  }

  logger.info('[cron/stale-applications] Archived stale applications', { archived: archived ?? ids.length });
  return NextResponse.json({ ok: true, archived: archived ?? ids.length });
});
