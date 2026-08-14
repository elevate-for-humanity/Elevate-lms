import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
const PENDING_STATUSES = ['pending', 'submitted', 'in_review'];

function buildFollowUpHtml(firstName: string, programInterest: string): string {
  const program = programInterest
    ? programInterest.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'your program of interest';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;margin:0;padding:0">
<div style="max-width:680px;margin:0 auto;padding:24px">
<div style="background:#1e293b;padding:30px;text-align:center;border-radius:8px 8px 0 0">
<h1 style="margin:0;color:white;font-size:22px">Still Interested in ${program}?</h1>
<p style="margin:8px 0 0;color:#fed7aa;font-size:14px">${PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute</p>
</div>
<div style="padding:30px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
<p>Hi ${firstName},</p>
<p>We received your application for the <strong>${program}</strong> program and we have not forgotten about you.</p>
<p>Training may be funded for eligible applicants through WIOA, WRG, or other workforce funding. Eligibility and award decisions are made by the applicable funding agency.</p>
<h2 style="color:#1e293b;font-size:17px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">YOUR NEXT STEP</h2>
<p>Create or confirm your Indiana Career Connect account, contact your local WorkOne office, and ask about funding eligibility for the ${program} program at ${PLATFORM_DEFAULTS.orgName}.</p>
<p>After your WorkOne appointment, call us at <strong>${PLATFORM_DEFAULTS.supportPhone}</strong> or reply to this email so we can coordinate enrollment.</p>
<p style="margin-top:28px">Elizabeth Greene<br>Director, Elevate for Humanity Career &amp; Technical Institute<br>${PLATFORM_DEFAULTS.supportPhone}<br><a href="${SITE_URL}" style="color:#f97316">${SITE_URL}</a></p>
</div></div></body></html>`;
}

function buildFollowUpText(firstName: string, programInterest: string): string {
  const program = programInterest
    ? programInterest.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'your program of interest';

  return `Hi ${firstName},\n\nWe received your application for the ${program} program at ${PLATFORM_DEFAULTS.orgName}.\n\nFunding may be available for eligible applicants through WIOA, WRG, or other workforce programs. Contact your local WorkOne office to confirm eligibility and next steps.\n\nAfter your WorkOne appointment, call us at ${PLATFORM_DEFAULTS.supportPhone} or reply to this email so we can coordinate enrollment.\n\nElizabeth Greene\nDirector, Elevate for Humanity Career & Technical Institute\n${PLATFORM_DEFAULTS.supportPhone}\n${SITE_URL}`;
}

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const statusFilter: string[] = body.statuses || PENDING_STATUSES;
  const programFilter: string | null = body.program || null;

  let query = db
    .from('applications')
    .select('id, first_name, full_name, email, program_interest, status')
    .in('status', statusFilter)
    .not('email', 'is', null);

  if (programFilter) query = query.ilike('program_interest', `%${programFilter}%`);

  const { data: applications, error } = await query;
  if (error) {
    logger.error('[follow-up-blast] application query failed', undefined, { operation: 'load_pending_applications' });
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
  if (!applications || applications.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'No pending applications found' });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const app of applications) {
    if (!app.email) {
      skipped++;
      continue;
    }

    const firstName = app.first_name || app.full_name?.split(' ')[0] || 'there';
    const program = app.program_interest || '';

    try {
      await sendEmail({
        to: app.email,
        subject: `Your ${program ? program.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' ' : ''}Application — Next Steps`,
        html: buildFollowUpHtml(firstName, program),
        text: buildFollowUpText(firstName, program),
      });

      await db
        .from('applications')
        .update({ support_notes: `Follow-up email sent ${new Date().toISOString()}` })
        .eq('id', app.id);
      sent++;
    } catch {
      logger.warn('[follow-up-blast] email failed', {
        appId: app.id,
        operation: 'send_follow_up',
      });
      errors.push('Failed to send to one recipient');
      skipped++;
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    total: applications.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
