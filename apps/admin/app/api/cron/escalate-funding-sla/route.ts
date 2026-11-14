// GET /api/cron/escalate-funding-sla
// Runs daily via Northflank cron.
// Calls escalate_funding_verification_sla() RPC to mark payment_integrity_flags
// rows that have exceeded their SLA window. Does not auto-revoke.
// Protected by CRON_SECRET header.

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { emitEvent } from '@/lib/events/emit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
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

    const escalated = escalatedCount ?? 0;
    if (escalated > 0) {
      void emitEvent('funding.sla_escalated', 'compliance', {
        severity: 'warning',
        actor_type: 'cron',
        subject_type: 'payment_integrity_flags',
        payload: { escalated, queueSize: queueSize ?? 0 },
        message: `Funding SLA: ${escalated} flag(s) escalated, ${queueSize ?? 0} in queue`,
      });
    }

    return NextResponse.json({
      success: true,
      escalated,
      queueSize: queueSize ?? 0,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('escalate-funding-sla cron error:', err);
    void emitEvent('cron.failed', 'system', {
      severity: 'error',
      actor_type: 'cron',
      subject_id: 'escalate-funding-sla',
      subject_type: 'cron_job',
      payload: { error: err instanceof Error ? err.message : String(err) },
      message: 'Cron job escalate-funding-sla failed',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRuntime(withApiAudit('/api/cron/escalate-funding-sla', _GET));
