/**
 * GET /api/cron/process-notifications
 * Flush pending notifications: mark stale unread notifications as expired,
 * emit platform event for notification backlog if count is high.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Count unread older than 30 days
  const { count: staleCount } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
    .lt('created_at', cutoff);

  // Mark them read (expired)
  const { error, count: updated } = await db
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
    .lt('created_at', cutoff);

  if (error) {
    logger.error('[cron/process-notifications] Update failed', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  logger.info('[cron/process-notifications] Done', { stale_found: staleCount, marked_read: updated });
  return NextResponse.json({ ok: true, stale_found: staleCount ?? 0, marked_read: updated ?? 0 });
});
