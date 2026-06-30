/**
 * GET /api/cron/testing-lead-followup
 * Follow up with exam leads (prospects who expressed interest in testing)
 * that haven't converted to a scheduled session within 7 days.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOLLOWUP_DAYS = 7;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - FOLLOWUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Leads that haven't been followed up and are older than FOLLOWUP_DAYS
  const { data: leads, error } = await db
    .from('testing_leads')
    .select('id, name, email, exam_interest, created_at, last_followup_at')
    .eq('status', 'new')
    .lt('created_at', cutoff)
    .or(`last_followup_at.is.null,last_followup_at.lt.${cutoff}`)
    .limit(100);

  if (error) {
    logger.error('[cron/testing-lead-followup] DB error', { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = leads ?? [];
  let followed = 0;

  for (const lead of rows) {
    if (!lead.email) continue;

    await sendEmail({
      to: lead.email,
      subject: `Ready to schedule your ${lead.exam_interest ?? 'certification'} exam?`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#1e293b">Still interested in testing?</h2>
  <p>Hi ${lead.name ?? 'there'},</p>
  <p>We noticed you expressed interest in the <strong>${lead.exam_interest ?? 'certification exam'}</strong>. We'd love to help you get scheduled.</p>
  <p>Our proctored testing sessions are available in-person and online. Reply to this email or call us at <a href="tel:+13175594999">(317) 559-4999</a> to book your spot.</p>
  <p style="margin-top:24px">
    <a href="https://www.elevateforhumanity.org/testing" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Schedule Your Exam →</a>
  </p>
  <p style="color:#64748b;font-size:13px;margin-top:24px">— Elevate for Humanity Testing Center</p>
</div>
      `.trim(),
    }).catch((err) =>
      logger.error('[cron/testing-lead-followup] Failed to send followup email', { leadId: lead.id, error: String(err) }),
    );

    // Update last_followup_at
    await db
      .from('testing_leads')
      .update({ last_followup_at: today, status: 'contacted' })
      .eq('id', lead.id)
      .then(undefined, (err) =>
        logger.error('[cron/testing-lead-followup] Failed to update lead', { leadId: lead.id, error: String(err) }),
      );

    followed++;
  }

  logger.info('[cron/testing-lead-followup] followed up', { followed });
  return NextResponse.json({ ok: true, followed });
});
