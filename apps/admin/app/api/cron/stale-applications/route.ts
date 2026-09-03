/**
 * GET /api/cron/stale-applications
 *
 * Archives applications that have received 2+ follow-up emails and have had
 * no status change in 90+ days. Calls archive_stale_applications() DB function.
 *
 * Scheduled daily at 8 AM UTC via .github/workflows/cron-scheduler.yml.
 * Also callable manually from Dev Studio or curl with the cron secret.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return safeError('Unauthorized', 401);
  }

  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc('archive_stale_applications', {
    p_stale_days: 90,
  });

  if (error) {
    logger.error('[stale-applications] RPC error', error);
    return safeError('Archive function failed', 500);
  }

  const result = Array.isArray(data) ? data[0] : data;
  const archivedCount: number = result?.archived_count ?? 0;
  const applicationIds: string[] = result?.application_ids ?? [];

  logger.info('[stale-applications] Run complete', { archivedCount, applicationIds });

  return NextResponse.json({
    ok: true,
    archived: archivedCount,
    ids: applicationIds,
  });
}
