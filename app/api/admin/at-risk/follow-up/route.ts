export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email/sendgrid';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { studentId, enrollmentId } = await request.json();
  if (!studentId) return safeError('studentId required', 400);

  const db = createAdminClient();

  const { data: profile, error } = await db
    .from('profiles')
    .select('id, full_name, email, first_name')
    .eq('id', studentId)
    .maybeSingle();

  if (error) return safeInternalError(error, 'Failed to load student');
  if (!profile?.email) return safeError('Student has no email address', 400);

  const firstName = profile.first_name ?? profile.full_name?.split(' ')[0] ?? 'Student';

  await sendEmail({
    to: profile.email,
    subject: 'We want to help you get back on track — Elevate for Humanity',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Hi ${firstName},</h2>
        <p>We noticed you haven't been active in your program recently and we want to make sure you have the support you need.</p>
        <p>Your success matters to us. If you're facing any challenges — scheduling, funding, personal circumstances — please reach out and we'll work with you.</p>
        <p><strong>Reply to this email</strong> or call us directly and we'll connect you with your case manager.</p>
        <p style="margin-top:24px">— Elevate for Humanity Student Services</p>
      </div>
    `,
  });

  // Log the intervention
  await db.from('student_interventions').upsert({
    student_id: studentId,
    enrollment_id: enrollmentId ?? null,
    intervention_type: 'follow_up_email',
    notes: 'Admin-triggered follow-up from at-risk dashboard',
    created_at: new Date().toISOString(),
  }).select().maybeSingle().catch(() => null); // non-fatal if table doesn't exist yet

  return NextResponse.json({ ok: true });
}
