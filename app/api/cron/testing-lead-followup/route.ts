/**
 * GET /api/cron/testing-lead-followup
 *
 * Runs every hour. Sends follow-up emails to exam booking leads
 * that captured an email but never completed a booking.
 *
 *   follow_up_1 — sent 24hrs after lead created (if not converted)
 *   follow_up_2 — sent 48hrs after lead created (if not converted)
 *
 * Schedule: 0 * * * * (every hour, on the hour)
 * Secured by CRON_SECRET header.
 * Idempotent — flags prevent double-sending.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

import { hydrateProcessEnv } from '@/lib/secrets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FROM = 'Elevate Testing Center <testing@elevateforhumanity.org>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const BOOK_URL = `${SITE_URL}/certification-testing`;

function firstName(lead: { first_name: string | null }) {
  return lead.first_name ?? 'there';
}

function examLabel(examType: string) {
  const labels: Record<string, string> = {
    CCMA:    'Certified Clinical Medical Assistant (CCMA)',
    CPT:     'Certified Phlebotomy Technician (CPT)',
    CET:     'Certified EKG Technician (CET)',
    CMAA:    'Certified Medical Administrative Assistant (CMAA)',
    ExCPT:   'Certified Pharmacy Technician (ExCPT)',
    'CPCT/A': 'Certified Patient Care Technician (CPCT/A)',
    nha:     'NHA Certification Exam',
  };
  return labels[examType] ?? examType;
}

export async function GET(req: NextRequest) {
  await hydrateProcessEnv();
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  const now = new Date();
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ago48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  // Upper bound: don't send follow-ups to leads older than 7 days
  const ago7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let sent1 = 0;
  let sent2 = 0;
  let errors = 0;

  // ── Follow-up 1 — 24hrs ──────────────────────────────────────────────────
  const { data: leads1, error: err1 } = await db
    .from('exam_booking_leads')
    .select('id, email, exam_type, first_name')
    .eq('converted', false)
    .eq('follow_up_1_sent', false)
    .lte('created_at', ago24h)   // at least 24hrs old
    .gte('created_at', ago7d)    // not older than 7 days
    .limit(50);

  if (err1) {
    logger.error('[testing-lead-followup] Failed to fetch 24hr leads', { err1 });
  } else if (leads1) {
    for (const lead of leads1) {
      try {
        await sendEmail({
          to: lead.email,
          from: FROM,
          subject: `Still need your ${lead.exam_type} exam? Spots available this week`,
          html: followUp1Html(lead),
        });
        await db
          .from('exam_booking_leads')
          .update({ follow_up_1_sent: true })
          .eq('id', lead.id);
        sent1++;
      } catch (err) {
        logger.warn('[testing-lead-followup] 24hr email failed', { id: lead.id, err });
        errors++;
      }
    }
  }

  // ── Follow-up 2 — 48hrs ──────────────────────────────────────────────────
  const { data: leads2, error: err2 } = await db
    .from('exam_booking_leads')
    .select('id, email, exam_type, first_name')
    .eq('converted', false)
    .eq('follow_up_1_sent', true)   // only after first follow-up was sent
    .eq('follow_up_2_sent', false)
    .lte('created_at', ago48h)
    .gte('created_at', ago7d)
    .limit(50);

  if (err2) {
    logger.error('[testing-lead-followup] Failed to fetch 48hr leads', { err2 });
  } else if (leads2) {
    for (const lead of leads2) {
      try {
        await sendEmail({
          to: lead.email,
          from: FROM,
          subject: `Last call — secure your ${lead.exam_type} exam date`,
          html: followUp2Html(lead),
        });
        await db
          .from('exam_booking_leads')
          .update({ follow_up_2_sent: true })
          .eq('id', lead.id);
        sent2++;
      } catch (err) {
        logger.warn('[testing-lead-followup] 48hr email failed', { id: lead.id, err });
        errors++;
      }
    }
  }

  logger.info('[testing-lead-followup] Done', { sent1, sent2, errors });
  return NextResponse.json({ success: true, sent1, sent2, errors });
}

// ── Email templates ──────────────────────────────────────────────────────────

function followUp1Html(lead: { first_name: string | null; exam_type: string }) {
  const name = firstName(lead);
  const exam = examLabel(lead.exam_type);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1E3A5F;padding:24px 32px">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Elevate for Humanity Testing Center</p>
    <h1 style="color:#fff;font-size:20px;margin:0">Still need your certification exam?</h1>
  </div>
  <div style="padding:28px 32px;color:#1E293B;font-size:15px;line-height:1.7">
    <p>Hi ${name},</p>
    <p>You started booking your <strong>${exam}</strong> but didn't finish. We still have openings this week.</p>
    <p style="margin:24px 0;text-align:center">
      <a href="${BOOK_URL}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
        Book Your Exam Now →
      </a>
    </p>
    <p style="font-size:13px;color:#64748b">
      Fast scheduling · Secure proctored testing · Instant confirmation<br>
      $243 total — no hidden fees.
    </p>
    <p style="font-size:13px;color:#64748b;margin-top:20px">
      Questions? Call <a href="tel:3173143757" style="color:#1E3A5F;font-weight:600">(317) 314-3757</a> or reply to this email.
    </p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;color:#94a3b8;font-size:11px">
    8888 Keystone Crossing Suite 1300 · Indianapolis, IN 46240<br>
    <a href="${SITE_URL}/unsubscribe?email={{email}}" style="color:#94a3b8">Unsubscribe</a>
  </div>
</div>
</body></html>`;
}

function followUp2Html(lead: { first_name: string | null; exam_type: string }) {
  const name = firstName(lead);
  const exam = examLabel(lead.exam_type);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1E3A5F;padding:24px 32px">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Elevate for Humanity Testing Center</p>
    <h1 style="color:#fff;font-size:20px;margin:0">Last call for this week's testing slots</h1>
  </div>
  <div style="padding:28px 32px;color:#1E293B;font-size:15px;line-height:1.7">
    <p>Hi ${name},</p>
    <p>This is our last reminder about your <strong>${exam}</strong>. We limit daily testing slots to keep the environment focused — once they're gone, you'll need to wait for the next opening.</p>
    <p style="margin:24px 0;text-align:center">
      <a href="${BOOK_URL}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
        Secure Your Spot →
      </a>
    </p>
    <p style="font-size:13px;color:#64748b">
      $243 total · Secure checkout · Instant confirmation
    </p>
    <p style="font-size:13px;color:#64748b;margin-top:20px">
      Need help? Call <a href="tel:3173143757" style="color:#1E3A5F;font-weight:600">(317) 314-3757</a>.
    </p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;color:#94a3b8;font-size:11px">
    8888 Keystone Crossing Suite 1300 · Indianapolis, IN 46240<br>
    <a href="${SITE_URL}/unsubscribe?email={{email}}" style="color:#94a3b8">Unsubscribe</a>
  </div>
</div>
</body></html>`;
}
