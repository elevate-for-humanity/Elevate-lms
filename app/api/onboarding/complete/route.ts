import { safeInternalError } from '@/lib/api/safe-error';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/auth';
import { approveApplication } from '@/lib/enrollment/approve';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

async function sendEnrollmentConfirmationEmail({
  to,
  firstName,
  programName,
}: {
  to: string;
  firstName: string;
  programName: string;
}) {
  const logoUrl = `${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

  await sendEmail({
    to,
    subject: `You're enrolled in ${programName} — Elevate for Humanity`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a;background:#ffffff">
        <div style="text-align:center;padding:32px 24px 24px">
          <img src="${logoUrl}" alt="Elevate for Humanity" width="160" style="max-width:160px;height:auto" />
        </div>
        <div style="padding:0 32px 32px">
          <h2 style="font-weight:normal;font-size:22px;margin:0 0 20px;color:#1a1a1a">Hi ${firstName}, you're enrolled!</h2>
          <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
            You've completed onboarding and your enrollment in <strong>${programName}</strong> is now active.
            Your courses are unlocked and ready to start.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0">
            <p style="margin:0;font-size:15px;font-weight:bold;color:#15803d">✅ Enrollment confirmed — ${programName}</p>
          </div>
          <h3 style="font-size:16px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">What happens next</h3>
          <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#333;line-height:1.9">
            <li>Log in to your student dashboard to access your courses</li>
            <li>Complete your first lesson — it takes about 15 minutes</li>
            <li>Track your progress and earn your first badge</li>
            <li>Your advisor will reach out within 1 business day to confirm your schedule</li>
            <li>Attend your first in-person session on your confirmed start date</li>
          </ol>
          <div style="text-align:center;margin:28px 0">
            <a href="${SITE_URL}/learner/dashboard"
               style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px">
              Go to My Dashboard
            </a>
          </div>
          <div style="border-top:1px solid #e0e0e0;margin-top:12px;padding-top:16px;font-family:Arial,sans-serif;font-size:13px;color:#555">
            <p style="margin:0 0 8px">Questions? We're here to help:</p>
            <p style="margin:0 0 4px">📞 <a href="tel:3173143757" style="color:#555">(317) 314-3757</a></p>
            <p style="margin:0">✉️ <a href="mailto:elevate4humanityedu@gmail.com" style="color:#555">elevate4humanityedu@gmail.com</a></p>
          </div>
          <div style="border-top:1px solid #e0e0e0;margin-top:32px;padding-top:20px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#999">
            <p style="margin:0 0 4px">Elevate for Humanity Career &amp; Technical Institute</p>
            <p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
            <p style="margin:0"><a href="${SITE_URL}" style="color:#999;text-decoration:underline">www.elevateforhumanity.org</a> &nbsp;|&nbsp; (317) 314-3757</p>
          </div>
        </div>
      </div>`,
  });
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

    // Fetch profile + most recent application + enrollment in parallel
    const [profileResult, appResult, enrollmentResult] = await Promise.all([
      db.from('profiles')
        .select('first_name, full_name, email, onboarding_completed, enrollment_status')
        .eq('id', userId)
        .single(),
      db.from('applications')
        .select('id, status, program_id, program_interest')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.from('program_enrollments')
        .select('id, program_id, enrollment_state')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      logger.error('[onboarding/complete] Failed to fetch profile', { userId, error: profileResult.error.message });
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
    }

    const profile = profileResult.data;
    const application = appResult.data;
    const enrollment = enrollmentResult.data;

    // Idempotent — already fully enrolled, just return success
    if (
      profile?.onboarding_completed &&
      profile?.enrollment_status === 'active' &&
      enrollment?.enrollment_state === 'active'
    ) {
      return NextResponse.json({ success: true, alreadyComplete: true });
    }

    // Mark onboarding complete
    await db.from('profiles').update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    }).eq('id', userId);

    // Run approval pipeline if application not yet approved
    const programId = enrollment?.program_id || application?.program_id || null;
    if (application?.id && application.status !== 'approved') {
      const approvalResult = await approveApplication(db, {
        applicationId: application.id,
        programId,
        fundingType: null,
        role: 'student',
      });
      if (approvalResult.success) {
        logger.info('[onboarding/complete] Application approved', { userId, applicationId: application.id });
      } else {
        logger.warn('[onboarding/complete] Approval failed', { userId, error: approvalResult.error });
      }
    } else if (enrollment && enrollment.enrollment_state !== 'active') {
      // Enrollment exists but not active — activate it
      await db.from('program_enrollments')
        .update({ enrollment_state: 'active', status: 'active' })
        .eq('id', enrollment.id);
    }

    // Resolve program name for email
    let programName = 'your training program';
    if (programId) {
      const { data: prog } = await db
        .from('apprenticeship_programs')
        .select('name')
        .eq('id', programId)
        .maybeSingle();
      if (prog?.name) programName = prog.name;
    }
    if (programName === 'your training program' && application?.program_interest) {
      programName = application.program_interest.replace(/-/g, ' ');
    }

    const email = profile?.email || session.user.email || '';
    const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Student';

    if (email) {
      // Non-blocking — don't fail the request if email fails
      sendEnrollmentConfirmationEmail({ to: email, firstName, programName })
        .catch(err => logger.warn('[onboarding/complete] Enrollment email failed', err));

      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[ENROLLED] ${profile?.full_name || firstName} — ${programName}`,
        html: `<p><strong>${profile?.full_name || firstName}</strong> completed onboarding and is now enrolled in <strong>${programName}</strong>.</p><p>Email: <a href="mailto:${email}">${email}</a></p><p><a href="${SITE_URL}/admin/enrollments">View in Admin</a></p>`,
      }).catch(err => logger.warn('[onboarding/complete] Admin notification failed', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding complete. Enrollment activated.',
      programName,
    });
  } catch (error) {
    logger.error('Onboarding completion error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/onboarding/complete', _POST);
