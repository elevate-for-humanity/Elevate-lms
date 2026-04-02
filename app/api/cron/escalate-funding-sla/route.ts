// GET /api/cron/escalate-funding-sla
// Netlify scheduled function — runs daily.
// Calls escalate_funding_verification_sla() RPC to mark payment_integrity_flags
// rows that have exceeded their SLA window. Does not auto-revoke.
// Protected by CRON_SECRET header.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
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
    const { data: escalatedCount, error } = await db.rpc('escalate_funding_verification_sla');

    if (error) {
      logger.error('escalate_funding_verification_sla RPC error:', error);
      return safeInternalError(error, 'RPC escalate_funding_verification_sla failed');
    }

    // Also fetch current queue size for monitoring
    const { count: queueSize } = await db
      .from('payment_integrity_flags')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null);

    logger.info('Funding SLA escalation complete', { escalatedCount, queueSize });

    return NextResponse.json({
      success: true,
      escalated: escalatedCount ?? 0,
      queueSize: queueSize ?? 0,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('escalate-funding-sla cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/cron/escalate-funding-sla', _GET);
