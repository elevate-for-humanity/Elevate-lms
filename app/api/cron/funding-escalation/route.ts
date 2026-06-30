// pre-auth-registry: exempt — cron route, runs as service role with no user session
/**
 * GET /api/cron/funding-escalation
 * Escalate funding assignments that have been pending > 7 days to critical alert.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ESCALATE_DAYS = 7;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - ESCALATE_DAYS * 86400000).toISOString();

  const { data: escalations, error } = await db
    .from('student_funding_assignments')
    .select('id, student_id, created_at, funding_sources(name, code), profiles!student_funding_assignments_student_id_fkey(full_name, email)')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .limit(50);

  if (error) {
    logger.error('[cron/funding-escalation] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!escalations?.length) return NextResponse.json({ ok: true, escalated: 0 });

  for (const row of escalations) {
    const daysWaiting = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);
    const source = (row as any).funding_sources;
    const profile = (row as any).profiles;

    await db.from('admin_alerts').insert({
      alert_type: 'funding_escalation',
      severity: 'critical',
      message: `Funding assignment for ${profile?.full_name ?? row.student_id} (${source?.name ?? 'unknown source'}) has been pending ${daysWaiting} days — ESCALATED`,
      metadata: { assignment_id: row.id, student_id: row.student_id, days_waiting: daysWaiting },
    })

    await emitEvent('funding.escalated', 'payment', {
      severity: 'error',
      actor_type: 'cron',
      subject_id: row.student_id,
      subject_type: 'student',
      payload: { assignment_id: row.id, days_waiting: daysWaiting },
      message: `Funding escalated: ${profile?.full_name ?? row.student_id} — ${daysWaiting} days pending`,
    })
  }

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[URGENT] ${escalations.length} funding assignment${escalations.length !== 1 ? 's' : ''} escalated — ${ESCALATE_DAYS}+ days pending`,
    html: `<p><strong>URGENT:</strong> ${escalations.length} student funding assignment${escalations.length !== 1 ? 's' : ''} have been pending for more than ${ESCALATE_DAYS} days and require immediate action.</p><ul>${escalations.map(r => { const p = (r as any).profiles; const s = (r as any).funding_sources; return `<li>${p?.full_name ?? r.student_id} — ${s?.name ?? 'unknown'} (${Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000)} days)</li>`; }).join('')}</ul><p><a href="https://www.elevateforhumanity.org/admin/funding">Resolve now →</a></p>`,
  }).catch((e: unknown) => logger.warn('[cron/funding-escalation] Admin email failed', { error: String(e) }));

  logger.info('[cron/funding-escalation] Done', { escalated: escalations.length });
  return NextResponse.json({ ok: true, escalated: escalations.length });
});
