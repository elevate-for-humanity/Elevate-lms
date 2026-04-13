/**
 * POST /api/cron/school-application-followup
 *
 * Runs daily at 9 AM ET. Sends a 3-step follow-up sequence to school
 * applicants who have not progressed past 'submitted' status.
 *
 * Sequence:
 *   T+24h — Reassurance: "We have your application, here's what's next"
 *   T+72h — Urgency: benefits + wage clarity + direct contact
 *   T+96h — Loss framing: "Spots are filling, next cohort starts soon"
 *
 * Idempotent: (application_id, sequence) unique constraint prevents re-sends.
 * Cron: 0 14 * * *  (9 AM ET = 14:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const dynamic     = 'force-dynamic';
export const runtime     = 'nodejs';
export const maxDuration = 60;

const SCHOOL_NAME  = 'Mesmerized by Beauty Cosmetology Academy';
const SCHOOL_EMAIL = 'mesmerizedbybeautyl@yahoo.com';
const ELEVATE_BCC  = 'info@elevateforhumanity.org';
const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

const PROGRAM_LABELS: Record<string, string> = {
  'cosmetology-apprenticeship':     'Cosmetology',
  'esthetician-apprenticeship':     'Esthetician',
  'nail-technician-apprenticeship': 'Nail Technician',
};

// ── Email templates ───────────────────────────────────────────────────────────

function header(subtitle = '') {
  return `
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px;text-align:center">
    <p style="color:rgba(255,255,255,0.75);font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Sponsored by Elevate for Humanity</p>
    <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px">${SCHOOL_NAME}</h1>
    ${subtitle ? `<p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0">${subtitle}</p>` : ''}
  </div>`;
}

function footer() {
  return `
  <div style="background:#f1f5f9;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">8325 Michigan Road · Indianapolis, IN 46268</p>
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Sponsored by <a href="${SITE_URL}" style="color:#7c3aed">Elevate for Humanity</a>
    </p>
  </div>`;
}

function wrap(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff">${content}${footer()}</div>
</body></html>`;
}

// T+24h — Reassurance
function email24h(firstName: string, programLabel: string): { subject: string; html: string } {
  return {
    subject: `Your ${programLabel} application — here's what happens next`,
    html: wrap(`
      ${header('Indianapolis, IN · DOL Registered Apprenticeship')}
      <div style="padding:32px">
        <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Hi ${firstName} — we have your application</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px">
          You applied for the <strong>${programLabel}</strong> program. Our admissions team is reviewing it now and will reach out within 1–2 business days to schedule your interview.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px">
          <p style="margin:0;font-size:14px;color:#166534;font-weight:600">What to expect:</p>
          <ul style="margin:8px 0 0;padding:0 0 0 16px;color:#166534;font-size:14px;line-height:1.8">
            <li>A call or email from our team within 1–2 business days</li>
            <li>A short interview — about 20 minutes, in person or by phone</li>
            <li>If accepted: funding paperwork + salon placement within 1 week</li>
            <li>First paid shift typically within 3–4 weeks of applying</li>
          </ul>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
          Questions before your interview? Reply to this email or reach us directly:
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;font-size:14px;color:#475569">
          <p style="margin:0 0 6px"><strong style="color:#1e293b">Email:</strong> <a href="mailto:${SCHOOL_EMAIL}" style="color:#7c3aed">${SCHOOL_EMAIL}</a></p>
          <p style="margin:0 0 6px"><strong style="color:#1e293b">Address:</strong> 8325 Michigan Road, Indianapolis, IN 46268</p>
          <p style="margin:0"><strong style="color:#1e293b">Hours:</strong> Mon–Fri, 9 AM – 5 PM ET</p>
        </div>
        <p style="color:#64748b;font-size:14px;margin:0">Talk soon,<br><strong style="color:#1e293b">Admissions Team</strong><br>${SCHOOL_NAME}</p>
      </div>`),
  };
}

// T+72h — Urgency + benefits
function email72h(firstName: string, programLabel: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, a few things about your ${programLabel} application`,
    html: wrap(`
      ${header()}
      <div style="padding:32px">
        <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Still with us, ${firstName}?</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px">
          You applied for <strong>${programLabel}</strong> a few days ago. We want to make sure you have everything you need to make a decision.
        </p>

        <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 12px">Here's what most people don't realize until after they enroll:</p>

        <div style="space-y:12px;margin-bottom:24px">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;padding:14px;background:#faf5ff;border-radius:10px">
            <span style="font-size:20px;flex-shrink:0">💵</span>
            <div>
              <p style="margin:0 0 4px;font-weight:700;color:#1e293b;font-size:14px">You earn wages from your first shift</p>
              <p style="margin:0;color:#475569;font-size:13px">This is a registered apprenticeship — not a school. You are an employee at a licensed salon. Apprentices typically earn $12–$16/hr during training.</p>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;padding:14px;background:#faf5ff;border-radius:10px">
            <span style="font-size:20px;flex-shrink:0">🚗</span>
            <div>
              <p style="margin:0 0 4px;font-weight:700;color:#1e293b;font-size:14px">Transportation is not a barrier</p>
              <p style="margin:0;color:#475569;font-size:13px">Through our partnership with Impact, eligible apprentices can access car repair assistance and transportation support. Getting to work is something we help solve.</p>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#faf5ff;border-radius:10px">
            <span style="font-size:20px;flex-shrink:0">📋</span>
            <div>
              <p style="margin:0 0 4px;font-weight:700;color:#1e293b;font-size:14px">Most students pay $0 in tuition</p>
              <p style="margin:0;color:#475569;font-size:13px">WIOA workforce funding covers program costs for most eligible applicants. We walk you through the application — it takes about 30 minutes.</p>
            </div>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:24px">
          <a href="mailto:${SCHOOL_EMAIL}?subject=Question about my ${programLabel} application"
            style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
            Reply with a question →
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">Or visit us at 8325 Michigan Road, Indianapolis, IN 46268 · Mon–Fri 9 AM–5 PM ET</p>
      </div>`),
  };
}

// T+96h — Loss framing
function email96h(firstName: string, programLabel: string): { subject: string; html: string } {
  return {
    subject: `Last chance to hold your spot — ${programLabel} cohort filling`,
    html: wrap(`
      ${header()}
      <div style="padding:32px">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:center">
          <p style="margin:0;color:#991b1b;font-size:14px;font-weight:700">⚠️ Cohort spots are limited — we fill on a first-come, first-served basis</p>
        </div>

        <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Hi ${firstName} — we don't want you to miss this</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px">
          You applied for <strong>${programLabel}</strong> four days ago. We have not heard back from you, and we want to make sure a spot is still available when you are ready.
        </p>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px">
          Our next cohort is forming now. Once it fills, the next opening may be 6–8 weeks away.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-weight:700;color:#1e293b;font-size:14px">If something came up, we understand. Tell us:</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              ['Still interested — just busy', `mailto:${SCHOOL_EMAIL}?subject=Still interested in ${programLabel}`],
              ['Have questions before deciding', `mailto:${SCHOOL_EMAIL}?subject=Questions about ${programLabel}`],
              ['Need help with transportation or funding', `mailto:${SCHOOL_EMAIL}?subject=Need help with ${programLabel} application`],
              ['Not the right time — remove me', `mailto:${SCHOOL_EMAIL}?subject=Remove me from ${programLabel} list`],
            ].map(([label, href]) => `
            <a href="${href}" style="display:block;padding:10px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;text-decoration:none;color:#1e293b;font-size:14px;font-weight:500">
              → ${label}
            </a>`).join('')}
          </div>
        </div>

        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 4px">
          If we don't hear from you after today, we will release your spot to the next applicant on the waitlist.
        </p>
        <p style="color:#94a3b8;font-size:13px;margin:0">
          — Admissions Team, ${SCHOOL_NAME}
        </p>
      </div>`),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

interface FollowupWindow {
  sequence: '24h' | '72h' | '96h';
  minHours: number;
  maxHours: number;
  build: (firstName: string, programLabel: string) => { subject: string; html: string };
}

const WINDOWS: FollowupWindow[] = [
  { sequence: '24h', minHours: 24,  maxHours: 48,  build: email24h },
  { sequence: '72h', minHours: 72,  maxHours: 96,  build: email72h },
  { sequence: '96h', minHours: 96,  maxHours: 120, build: email96h },
];

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    logger.error('[school-followup] admin client unavailable');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const now     = new Date();
  const h120ago = new Date(now.getTime() - 120 * 60 * 60 * 1000);
  const h24ago  = new Date(now.getTime() -  24 * 60 * 60 * 1000);

  const counts: Record<string, number> = { '24h': 0, '72h': 0, '96h': 0, errors: 0 };

  try {
    const { data: applications, error: fetchErr } = await supabase
      .from('school_applications')
      .select('id, first_name, email, program_interest, created_at')
      .eq('status', 'submitted')
      .gte('created_at', h120ago.toISOString())
      .lte('created_at', h24ago.toISOString());

    if (fetchErr) {
      logger.error('[school-followup] fetch error', fetchErr);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    if (!applications?.length) {
      return NextResponse.json({ ...counts, processed: 0, message: 'No applications in window' });
    }

    const appIds = applications.map(a => a.id);
    const { data: alreadySent } = await supabase
      .from('school_application_followups')
      .select('application_id, sequence')
      .in('application_id', appIds);

    const sentSet = new Set(
      (alreadySent ?? []).map(r => `${r.application_id}:${r.sequence}`)
    );

    for (const app of applications) {
      const ageMs       = now.getTime() - new Date(app.created_at).getTime();
      const programLabel = PROGRAM_LABELS[app.program_interest] ?? app.program_interest;

      for (const window of WINDOWS) {
        const minMs = window.minHours * 3600 * 1000;
        const maxMs = window.maxHours * 3600 * 1000;
        const key   = `${app.id}:${window.sequence}`;

        if (ageMs < minMs || ageMs >= maxMs) continue;
        if (sentSet.has(key)) continue;

        try {
          const { subject, html } = window.build(app.first_name, programLabel);

          await sendEmail({
            to:      app.email,
            bcc:     ELEVATE_BCC,
            subject,
            html,
            replyTo: SCHOOL_EMAIL,
          });

          await supabase.from('school_application_followups').insert({
            application_id: app.id,
            sequence:       window.sequence,
            sent_at:        now.toISOString(),
          });

          sentSet.add(key);
          counts[window.sequence]++;
          logger.info(`[school-followup] ${window.sequence} sent`, { id: app.id });
        } catch (err) {
          logger.error(`[school-followup] ${window.sequence} failed`, { id: app.id, err });
          counts.errors++;
        }
      }
    }

    return NextResponse.json({ ...counts, processed: applications.length });
  } catch (err) {
    logger.error('[school-followup] unhandled error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
