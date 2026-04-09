import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

// Statuses that mean the applicant hasn't been enrolled yet and needs a nudge
const PENDING_STATUSES = ['pending', 'submitted', 'in_review'];

function buildFollowUpHtml(firstName: string, programInterest: string): string {
  const program = programInterest
    ? programInterest.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'your program of interest';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;margin:0;padding:0">
<div style="max-width:680px;margin:0 auto;padding:24px">

  <div style="background:#1e293b;padding:30px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:white;font-size:22px">Still Interested in ${program}?</h1>
    <p style="margin:8px 0 0;color:#fed7aa;font-size:14px">Elevate for Humanity Career &amp; Technical Institute</p>
  </div>

  <div style="padding:30px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">

    <p>Hi ${firstName},</p>

    <p>We received your application for the <strong>${program}</strong> program and we have not forgotten about you.</p>

    <p>We want to make sure you get started. <strong>Training is free for most applicants</strong> through WIOA, WRG, or Job Ready Indy funding — the government pays your tuition so you pay nothing out of pocket.</p>

    <h2 style="color:#1e293b;font-size:17px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">YOUR NEXT STEP — DO THIS TODAY</h2>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #f97316;padding:16px;border-radius:0 6px 6px 0;margin:12px 0">
      <h3 style="margin-top:0;color:#1e293b">Step 1 — Create an Indiana Career Connect Account</h3>
      <p>Go to <a href="https://www.indianacareerconnect.com" style="color:#f97316;font-weight:bold">www.indianacareerconnect.com</a> and create a Job Seeker account. This is required before WorkOne can approve your funding.</p>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #f97316;padding:16px;border-radius:0 6px 6px 0;margin:12px 0">
      <h3 style="margin-top:0;color:#1e293b">Step 2 — Call WorkOne and Schedule an Appointment</h3>
      <p><strong>Indianapolis WorkOne: (317) 890-4640</strong></p>
      <p>Tell them: <em>"I want to apply for WIOA funding for the ${program} program at Elevate for Humanity Career &amp; Technical Institute."</em></p>
      <p>Bring: photo ID, proof of income, proof of address.</p>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #f97316;padding:16px;border-radius:0 6px 6px 0;margin:12px 0">
      <h3 style="margin-top:0;color:#1e293b">Step 3 — Call Us After Your WorkOne Appointment</h3>
      <p>Once WorkOne approves your funding, call us at <strong>(317) 314-3757</strong> or reply to this email. We will get you enrolled and give you a start date.</p>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;padding:14px 16px;border-radius:6px;margin:20px 0;font-weight:bold;color:#991b1b;text-align:center">
      WorkOne appointments fill up fast. Call today — do not wait.
    </div>

    <p>Questions? Call <strong>(317) 314-3757</strong> or reply to this email. We are here to help you every step of the way.</p>

    <p style="margin-top:28px">
      Elizabeth Greene<br>
      Director, Elevate for Humanity Career &amp; Technical Institute<br>
      (317) 314-3757<br>
      <a href="${SITE_URL}" style="color:#f97316">${SITE_URL}</a>
    </p>

    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
      You applied to Elevate for Humanity Career &amp; Technical Institute. Reply to unsubscribe.
    </div>

  </div>
</div>
</body></html>`;
}

function buildFollowUpText(firstName: string, programInterest: string): string {
  const program = programInterest
    ? programInterest.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'your program of interest';

  return `Hi ${firstName},

We received your application for the ${program} program at Elevate for Humanity and we have not forgotten about you.

Training is free for most applicants through WIOA, WRG, or Job Ready Indy funding.

YOUR NEXT STEPS:

1. Create an Indiana Career Connect account at www.indianacareerconnect.com

2. Call WorkOne Indianapolis at (317) 890-4640 and say:
   "I want to apply for WIOA funding for the ${program} program at Elevate for Humanity Career & Technical Institute."
   Bring: photo ID, proof of income, proof of address.

3. After your WorkOne appointment, call us at (317) 314-3757 or reply to this email.
   We will get you enrolled and give you a start date.

WorkOne appointments fill up fast. Call today.

Questions? Call (317) 314-3757 or reply to this email.

Elizabeth Greene
Director, Elevate for Humanity Career & Technical Institute
(317) 314-3757
${SITE_URL}`;
}

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);

  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  // Optional: filter by status or program from request body
  const body = await request.json().catch(() => ({}));
  const statusFilter: string[] = body.statuses || PENDING_STATUSES;
  const programFilter: string | null = body.program || null;

  let query = db
    .from('applications')
    .select('id, first_name, full_name, email, program_interest, status')
    .in('status', statusFilter)
    .not('email', 'is', null);

  if (programFilter) {
    query = query.ilike('program_interest', `%${programFilter}%`);
  }

  const { data: applications, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }

  if (!applications || applications.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'No pending applications found' });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const app of applications) {
    if (!app.email) { skipped++; continue; }

    const firstName = app.first_name || app.full_name?.split(' ')[0] || 'there';
    const program = app.program_interest || '';

    try {
      await sendEmail({
        to: app.email,
        subject: `Your ${program ? program.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' ' : ''}Application — Next Steps to Get Started`,
        html: buildFollowUpHtml(firstName, program),
        text: buildFollowUpText(firstName, program),
      });

      // Log the follow-up so we don't spam
      await db
        .from('applications')
        .update({ support_notes: `Follow-up email sent ${new Date().toISOString()}` })
        .eq('id', app.id);

      sent++;
    } catch (err: any) {
      // Log full error server-side, return only a safe count to the caller
      logger.warn('[follow-up-blast] email failed', { appId: app.id, err: err?.message });
      errors.push(`Failed to send to recipient ${skipped + 1}`);
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
