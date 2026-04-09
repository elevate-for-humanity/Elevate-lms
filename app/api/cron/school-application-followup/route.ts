/**
 * POST /api/cron/school-application-followup
 *
 * Runs daily. Sends follow-up emails to school applicants who have not
 * progressed past 'submitted' status.
 *
 * Schedule:
 *   T+24h — "We received your application" nudge with direct contact info
 *   T+72h — "Still interested?" with a softer re-engagement + support offer
 *
 * Idempotent: tracks sent emails in school_application_followups table.
 * A given (application_id, sequence) pair is never sent twice.
 *
 * Cron expression (netlify.toml): 0 14 * * *  (9 AM ET daily)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const dynamic    = 'force-dynamic';
export const runtime    = 'nodejs';
export const maxDuration = 60;

const SCHOOL_NAME  = 'Mesmerized by Beauty Cosmetology Academy';
const SCHOOL_EMAIL = 'mesmerizedbybeautyl@yahoo.com';
const ELEVATE_BCC  = 'info@elevateforhumanity.org';

const PROGRAM_LABELS: Record<string, string> = {
  'cosmetology-apprenticeship':     'Cosmetology',
  'esthetician-apprenticeship':     'Esthetician',
  'nail-technician-apprenticeship': 'Nail Technician',
};

// ── Email templates ───────────────────────────────────────────────────────────

function t24hHtml(firstName: string, programLabel: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px;text-align:center">
    <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Sponsored by Elevate for Humanity</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">${SCHOOL_NAME}</h1>
  </div>
  <div style="padding:32px">
    <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Hi ${firstName} — we have your application</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px">
      You applied for the <strong>${programLabel}</strong> program yesterday. Our admissions team is reviewing it and will reach out within 1–2 more business days to schedule your interview.
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
      In the meantime, if you have any questions — about the program, scheduling, funding, or anything else — just reply to this email or reach us directly:
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:14px;color:#64748b"><strong style="color:#1e293b">Email:</strong> <a href="mailto:${SCHOOL_EMAIL}" style="color:#7c3aed">${SCHOOL_EMAIL}</a></p>
      <p style="margin:0 0 8px;font-size:14px;color:#64748b"><strong style="color:#1e293b">Address:</strong> 8325 Michigan Road, Indianapolis, IN 46268</p>
      <p style="margin:0;font-size:14px;color:#64748b"><strong style="color:#1e293b">Hours:</strong> Mon–Fri, 9 AM – 5 PM ET</p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#166534">
        <strong>Reminder:</strong> As a DOL Registered Apprentice, you earn wages from your first shift. Most students pay $0 out of pocket through WIOA workforce funding. We will walk you through it.
      </p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0">
      Talk soon,<br><strong>Admissions Team</strong><br>${SCHOOL_NAME}
    </p>
  </div>
  <div style="background:#f1f5f9;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">Sponsored by <a href="https://elevateforhumanity.institute" style="color:#7c3aed">Elevate for Humanity</a></p>
  </div>
</div>
</body></html>`;
}

function t72hHtml(firstName: string, programLabel: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px;text-align:center">
    <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Sponsored by Elevate for Humanity</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">${SCHOOL_NAME}</h1>
  </div>
  <div style="padding:32px">
    <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Still interested, ${firstName}?</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px">
      You applied for the <strong>${programLabel}</strong> program a few days ago. We want to make sure nothing fell through the cracks on our end.
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
      If you have questions, concerns, or something came up — just let us know. There is no pressure. We would rather answer your questions now than have you wonder later.
    </p>

    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin-bottom:20px">
      <h3 style="color:#6b21a8;font-size:14px;font-weight:700;margin:0 0 12px">Common questions we can answer right now</h3>
      <ul style="margin:0;padding:0 0 0 16px;color:#475569;font-size:14px;line-height:1.8">
        <li>Do I get paid during training? <strong style="color:#1e293b">Yes — from day one.</strong></li>
        <li>What if I need help getting to work? <strong style="color:#1e293b">We have transportation support through Impact.</strong></li>
        <li>Can I work part-time? <strong style="color:#1e293b">Yes — full-time and part-time tracks are available.</strong></li>
        <li>Will I owe tuition? <strong style="color:#1e293b">Most students pay $0 through WIOA funding.</strong></li>
      </ul>
    </div>

    <div style="text-align:center;margin-bottom:24px">
      <a href="mailto:${SCHOOL_EMAIL}?subject=Question about my ${programLabel} application"
        style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
        Reply with a question →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">
      Or visit us at 8325 Michigan Road, Indianapolis, IN 46268<br>
      Mon–Fri, 9 AM – 5 PM ET
    </p>
  </div>
  <div style="background:#f1f5f9;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">Sponsored by <a href="https://elevateforhumanity.institute" style="color:#7c3aed">Elevate for Humanity</a></p>
  </div>
</div>
</body></html>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    logger.error('[school-followup] admin client unavailable');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const now      = new Date();
  const h24ago   = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h48ago   = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const h72ago   = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const h96ago   = new Date(now.getTime() - 96 * 60 * 60 * 1000);

  let sent24 = 0, sent72 = 0, errors = 0;

  try {
    // ── Fetch submitted applications in the follow-up window ─────────────────
    const { data: applications, error: fetchErr } = await supabase
      .from('school_applications')
      .select('id, first_name, email, program_interest, created_at, status')
      .eq('status', 'submitted')
      .gte('created_at', h96ago.toISOString())  // not older than 96h
      .lte('created_at', h24ago.toISOString()); // at least 24h old

    if (fetchErr) {
      logger.error('[school-followup] fetch error', fetchErr);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ sent24: 0, sent72: 0, errors: 0, message: 'No applications in window' });
    }

    // ── Fetch already-sent follow-ups to avoid duplicates ────────────────────
    const appIds = applications.map(a => a.id);
    const { data: alreadySent } = await supabase
      .from('school_application_followups')
      .select('application_id, sequence')
      .in('application_id', appIds);

    const sentSet = new Set(
      (alreadySent ?? []).map(r => `${r.application_id}:${r.sequence}`)
    );

    // ── Process each application ─────────────────────────────────────────────
    for (const app of applications) {
      const createdAt     = new Date(app.created_at);
      const ageMs         = now.getTime() - createdAt.getTime();
      const programLabel  = PROGRAM_LABELS[app.program_interest] ?? app.program_interest;

      // T+24h: between 24h and 48h old
      const needs24 = ageMs >= 24 * 3600 * 1000 && ageMs < 48 * 3600 * 1000;
      // T+72h: between 72h and 96h old
      const needs72 = ageMs >= 72 * 3600 * 1000 && ageMs < 96 * 3600 * 1000;

      if (needs24 && !sentSet.has(`${app.id}:24h`)) {
        try {
          await sendEmail({
            to:      app.email,
            bcc:     ELEVATE_BCC,
            subject: `Your ${programLabel} application — we have it`,
            html:    t24hHtml(app.first_name, programLabel),
            replyTo: SCHOOL_EMAIL,
          });

          await supabase.from('school_application_followups').insert({
            application_id: app.id,
            sequence:       '24h',
            sent_at:        now.toISOString(),
          });

          sentSet.add(`${app.id}:24h`);
          sent24++;
          logger.info('[school-followup] 24h sent', { id: app.id, email: app.email });
        } catch (err) {
          logger.error('[school-followup] 24h send failed', { id: app.id, err });
          errors++;
        }
      }

      if (needs72 && !sentSet.has(`${app.id}:72h`)) {
        try {
          await sendEmail({
            to:      app.email,
            bcc:     ELEVATE_BCC,
            subject: `Still interested in ${programLabel}? — Mesmerized by Beauty`,
            html:    t72hHtml(app.first_name, programLabel),
            replyTo: SCHOOL_EMAIL,
          });

          await supabase.from('school_application_followups').insert({
            application_id: app.id,
            sequence:       '72h',
            sent_at:        now.toISOString(),
          });

          sentSet.add(`${app.id}:72h`);
          sent72++;
          logger.info('[school-followup] 72h sent', { id: app.id, email: app.email });
        } catch (err) {
          logger.error('[school-followup] 72h send failed', { id: app.id, err });
          errors++;
        }
      }
    }

    return NextResponse.json({
      sent24,
      sent72,
      errors,
      processed: applications.length,
    });
  } catch (err) {
    logger.error('[school-followup] unhandled error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
