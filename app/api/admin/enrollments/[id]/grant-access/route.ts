/**
 * POST /api/admin/enrollments/[id]/grant-access
 *
 * Sets access_granted_at on a program_enrollment row and sends the student
 * an email notifying them their access is live.
 *
 * Requires admin, super_admin, or staff role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  // Auth — admin/super_admin/staff only
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = createAdminClient();
  const { data: adminProfile } = await db
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!adminProfile || !['admin', 'super_admin', 'staff'].includes(adminProfile.role)) {
    return safeError('Forbidden', 403);
  }

  const { id: enrollmentId } = await params;
  const now = new Date().toISOString();

  // Fetch enrollment + student profile
  const { data: enrollment, error: fetchError } = await db
    .from('program_enrollments')
    .select('id, user_id, program_id, program_slug, full_name, email, access_granted_at')
    .eq('id', enrollmentId)
    .single();

  if (fetchError || !enrollment) return safeError('Enrollment not found', 404);
  if (enrollment.access_granted_at) return safeError('Access already granted', 409);

  // Grant access — move to active and record who granted it and when
  const { error: updateError } = await db
    .from('program_enrollments')
    .update({
      status: 'active',
      access_granted_at: now,
      updated_at: now,
    })
    .eq('id', enrollmentId);

  if (updateError) return safeInternalError(updateError, 'Failed to grant access');

  // Fetch program name
  let programName = enrollment.program_slug?.replace(/-/g, ' ') || 'your program';
  if (enrollment.program_id) {
    const { data: ap } = await db
      .from('apprenticeship_programs')
      .select('name')
      .eq('id', enrollment.program_id)
      .maybeSingle();
    if (ap?.name) programName = ap.name;
  }

  // Fetch student email from profiles if not on enrollment
  let studentEmail = enrollment.email;
  let studentName = enrollment.full_name || 'Student';
  if (!studentEmail && enrollment.user_id) {
    const { data: studentProfile } = await db
      .from('profiles')
      .select('email, full_name, first_name')
      .eq('id', enrollment.user_id)
      .single();
    studentEmail = studentProfile?.email;
    studentName = studentProfile?.full_name || studentProfile?.first_name || studentName;
  }

  const firstName = studentName.split(' ')[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const logoUrl = `${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

  // Send access-granted email to student
  if (studentEmail) {
    sendEmail({
      to: studentEmail,
      subject: `Your access to ${programName} is now active — Elevate for Humanity`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a;background:#ffffff">
          <div style="text-align:center;padding:32px 24px 24px">
            <img src="${logoUrl}" alt="Elevate for Humanity" width="160" style="max-width:160px;height:auto" />
          </div>
          <div style="padding:0 32px 32px">
            <h2 style="font-weight:normal;font-size:22px;margin:0 0 20px">Hi ${firstName}, your access is ready!</h2>
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
              Your application for <strong>${programName}</strong> has been approved and your course access is now active.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0">
              <p style="margin:0;font-size:15px;font-weight:bold;color:#15803d">✅ Access granted — you can start your courses now</p>
            </div>
            <div style="text-align:center;margin:28px 0">
              <a href="${siteUrl}/learner/dashboard"
                 style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px">
                Go to My Dashboard
              </a>
            </div>
            <p style="font-size:14px;color:#555;line-height:1.7">
              Questions? Call <a href="tel:3173143757" style="color:#1a1a1a">(317) 314-3757</a> or email
              <a href="mailto:info@elevateforhumanity.org" style="color:#1a1a1a">info@elevateforhumanity.org</a>
            </p>
          </div>
        </div>`,
    }).catch(e => logger.warn('[grant-access] Email failed', e));
  }

  logger.info('[grant-access] Access granted', {
    enrollmentId,
    grantedBy: user.id,
    studentEmail,
    programName,
  });

  return NextResponse.json({ ok: true, access_granted_at: now });
}
