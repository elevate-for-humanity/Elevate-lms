import { safeInternalError } from '@/lib/api/safe-error';
// GET /api/cron/expire-credentials
// Netlify scheduled function — runs daily when pg_cron is not available.
// Calls expire_stale_credentials() RPC and reports results.
// Protected by CRON_SECRET header (same pattern as expire-licenses).
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  // Verify cron secret — same pattern as expire-licenses
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    const { data, error } = await db.rpc('expire_stale_credentials');

    if (error) {
      logger.error('expire_stale_credentials RPC failed', { error: error.message });
      return NextResponse.json({ error: 'Expiration job failed' }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    const expiredCount = result?.expired_count ?? 0;

    logger.info('Credential expiration job completed', { expired_count: expiredCount });

    return NextResponse.json({
      success: true,
      expired_count: expiredCount,
      ran_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Credential expiration job threw', { err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRuntime(withApiAudit('/api/cron/expire-credentials', _GET));
