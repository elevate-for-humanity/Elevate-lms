import { safeInternalError } from '@/lib/api/safe-error';
// GET /api/cron/expire-exam-authorizations
// Fallback for environments where pg_cron is unavailable (local dev, Netlify).
// The pg_cron job runs this same logic nightly at 2am UTC in production.
// Protected by CRON_SECRET header.
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    const { data, error } = await db.rpc('expire_stale_exam_authorizations');

    if (error) {
      logger.error('expire_stale_exam_authorizations RPC failed', { error: error.message });
      return NextResponse.json({ error: 'Expiration job failed' }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    const expiredCount = result?.expired_count ?? 0;
    const programSummary = result?.program_summary ?? {};

    logger.info('Exam authorization expiration job completed', {
      expired_count: expiredCount,
      program_summary: programSummary,
    });

    return NextResponse.json({
      success: true,
      expired_count: expiredCount,
      program_summary: programSummary,
      ran_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Exam authorization expiration job threw', { err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRuntime(withApiAudit('/api/cron/expire-exam-authorizations', _GET));
