// pre-auth-registry: exempt — cron route, runs as service role with no user session
/**
 * GET /api/cron/escalate-funding-sla
 * Escalate funding SLA breaches — assignments pending > SLA threshold get critical alerts.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLA_DAYS = 5;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const slaCutoff = new Date(Date.now() - SLA_DAYS * 86400000).toISOString();

  const { data: breaches, error } = await db
    .from('student_funding_assignments')
    .select('id, student_id, created_at, funding_sources(name, code), profiles!student_funding_assignments_student_id_fkey(full_name, email)')
    .eq('status', 'pending')
    .lt('created_at', slaCutoff)
    .limit(50);

  if (error) {
    logger.error('[cron/escalate-funding-sla] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!breaches?.length) return NextResponse.json({ ok: true, escalated: 0 });

  for (const breach of breaches) {
    const daysOver = Math.floor((Date.now() - new Date(breach.created_at).getTime()) / 86400000) - SLA_DAYS;
    const source = (breach as any).funding_sources;
    const profile = (breach as any).profiles;

    await db.from('admin_alerts').insert({
      alert_type: 'funding_sla_breach',
      severity: daysOver > 3 ? 'critical' : 'high',
      message: `Funding SLA breach: ${profile?.full_name ?? breach.student_id} — ${source?.name ?? 'unknown'} — ${daysOver} days over SLA`,
      metadata: { assignment_id: breach.id, student_id: breach.student_id, days_over_sla: daysOver },
    }).onConflict('id').ignore().catch(() => {});

    await emitEvent('funding.sla_breach', 'funding', {
      severity: daysOver > 3 ? 'error' : 'warning',
      actor_type: 'cron',
      subject_id: breach.student_id,
      subject_type: 'student',
      payload: { assignment_id: breach.id, days_over_sla: daysOver },
      message: `Funding SLA breach: ${profile?.full_name ?? breach.student_id} — ${daysOver} days over`,
    }).catch(() => {});
  }

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[URGENT] ${breaches.length} funding SLA breach${breaches.length !== 1 ? 'es' : ''} — action required`,
    html: `<p><strong>${breaches.length} funding assignment${breaches.length !== 1 ? 's' : ''}</strong> have breached the ${SLA_DAYS}-day SLA:</p><ul>${breaches.map(b => { const p = (b as any).profiles; const s = (b as any).funding_sources; const days = Math.floor((Date.now() - new Date(b.created_at).getTime()) / 86400000); return `<li>${p?.full_name ?? b.student_id} — ${s?.name ?? 'unknown'} — ${days} days pending</li>`; }).join('')}</ul><p><a href="https://www.elevateforhumanity.org/admin/funding">Resolve now →</a></p>`,
  }).catch((e: unknown) => logger.warn('[cron/escalate-funding-sla] Email failed', { error: String(e) }));

  logger.info('[cron/escalate-funding-sla] Done', { escalated: breaches.length });
  return NextResponse.json({ ok: true, escalated: breaches.length });
});
