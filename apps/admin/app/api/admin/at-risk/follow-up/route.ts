export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { studentId, userId, riskId } = await request.json();
  const learnerId = userId ?? studentId;
  if (!learnerId) return safeError('userId required', 400);

  const db = await requireAdminClient();

  const { data: profile, error } = await db
    .from('profiles')
    .select('id, full_name, email, first_name')
    .eq('id', learnerId)
    .maybeSingle();

  if (error) return safeInternalError(error, 'Failed to load student');
  if (!profile?.email) return safeError('Student has no email address', 400);

  const firstName = profile.first_name ?? profile.full_name?.split(' ')[0] ?? 'Student';

  await sendEmail({
    to: profile.email,
    subject: 'We want to help you get back on track — ' + PLATFORM_DEFAULTS.orgName + '',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Hi ${firstName},</h2>
        <p>We noticed you haven't been active in your program recently and we want to make sure you have the support you need.</p>
        <p>Your success matters to us. If you're facing any challenges — scheduling, funding, personal circumstances — please reach out and we'll work with you.</p>
        <p><strong>Reply to this email</strong> or call us directly and we'll connect you with your case manager.</p>
        <p style="margin-top:24px">— ${PLATFORM_DEFAULTS.orgName} Student Services</p>
      </div>
    `,
  });

  // Non-fatal intervention write. Supabase surfaces table/database failures in
  // the resolved result rather than via Promise.catch on the query builder.
  const { error: interventionError } = await db
    .from('student_interventions')
    .insert({
      user_id: learnerId,
      at_risk_id: riskId ?? null,
      intervention_type: 'email',
      status: 'completed',
      notes: 'Admin-triggered follow-up from at-risk dashboard',
      outcome: 'Re-engagement email sent',
      completed_at: new Date().toISOString(),
      created_by: auth.id,
    })
    .select()
    .maybeSingle();
  if (interventionError) {
    return safeInternalError(interventionError, 'Email sent but the intervention record could not be created');
  }

  return NextResponse.json({ ok: true });
}
