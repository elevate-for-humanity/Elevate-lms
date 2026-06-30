/**
 * GET /api/cron/check-stuck-approvals
 * Alert on approval_chain_instances stuck in pending > 48h.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STUCK_HOURS = 48;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - STUCK_HOURS * 3600000).toISOString();

  const { data: stuck, error } = await db
    .from('approval_chain_instances')
    .select('id, chain_type, subject_id, subject_type, current_step, created_at, updated_at')
    .eq('status', 'pending')
    .lt('updated_at', cutoff)
    .limit(50);

  if (error) {
    logger.error('[cron/check-stuck-approvals] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!stuck?.length) return NextResponse.json({ ok: true, stuck: 0 });

  // Write admin alerts
  for (const instance of stuck) {
    const hoursStuck = Math.floor((Date.now() - new Date(instance.updated_at ?? instance.created_at).getTime()) / 3600000);
    await db.from('admin_alerts').insert({
      alert_type: 'stuck_approval',
      severity: hoursStuck > 96 ? 'critical' : 'warning',
      message: `Approval chain '${instance.chain_type}' for ${instance.subject_type}/${instance.subject_id} stuck at step ${instance.current_step} for ${hoursStuck}h`,
      metadata: { instance_id: instance.id, chain_type: instance.chain_type, hours_stuck: hoursStuck },
    })
  }

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Approvals] ${stuck.length} stuck approval chain${stuck.length !== 1 ? 's' : ''} > ${STUCK_HOURS}h`,
    html: `<p>${stuck.length} approval chain${stuck.length !== 1 ? 's' : ''} have been stuck for more than ${STUCK_HOURS} hours.</p><ul>${stuck.map(s => `<li>${s.chain_type} — ${s.subject_type}/${s.subject_id} (step ${s.current_step})</li>`).join('')}</ul><p><a href="https://www.elevateforhumanity.org/admin/approvals">Review →</a></p>`,
  }).catch((e: unknown) => logger.warn('[cron/check-stuck-approvals] Admin email failed', { error: String(e) }));

  logger.info('[cron/check-stuck-approvals] Done', { stuck: stuck.length });
  return NextResponse.json({ ok: true, stuck: stuck.length });
});
