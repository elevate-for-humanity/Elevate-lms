import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = 'info@elevateforhumanity.org';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

/**
 * POST /api/enrollment/approve
 *
 * Called after the DB trigger (verify_enrollment_complete) has approved the student.
 * Sends approval emails to both student and admin.
 * Idempotent — checks application status before sending.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the application is actually approved (DB trigger must have run)
    const { data: application } = await supabase
      .from('applications')
      .select('id, first_name, last_name, email, program_interest, status, reference_number')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Application not yet approved' }, { status: 400 });
    }

    // Check if approval email was already sent (idempotent)
    const { data: existing } = await supabase
      .from('onboarding_progress')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (existing?.status === 'approval_emailed') {
      return NextResponse.json({ already_sent: true });
    }

    const programLabel = (application.program_interest || 'your program').replace(/-/g, ' ');
    const refNumber = application.reference_number || application.id.slice(0, 8);

    // Send approval email to student
    await sendEmail({
      to: application.email,
      subject: `Enrollment Approved — Welcome to ${programLabel} [${refNumber}]`,
      html: [
        `<h2>Congratulations, ${application.first_name}!</h2>`,
        `<p>Your enrollment for <strong>${programLabel}</strong> at Elevate for Humanity has been <strong>approved</strong>.</p>`,
        `<p>All requirements have been verified:</p>`,
        `<ul>`,
        `<li>✅ Profile complete</li>`,
        `<li>✅ Enrollment agreement signed</li>`,
        `<li>✅ Handbook agreement signed</li>`,
        `<li>✅ FERPA consent signed</li>`,
        `<li>✅ Student handbook policies acknowledged</li>`,
        `<li>✅ Government ID uploaded</li>`,
        `<li>✅ Social Security card uploaded</li>`,
        `<li>✅ Transfer hours documentation uploaded</li>`,
        `<li>✅ All onboarding steps completed</li>`,
        `</ul>`,
        `<h3>What Happens Next</h3>`,
        `<ol>`,
        `<li>Access your course materials: <a href="${SITE_URL}/lms/dashboard">${SITE_URL}/lms/dashboard</a></li>`,
        `<li>Your instructor will contact you with your class schedule</li>`,
        `<li>If you applied for WIOA funding, we will coordinate with WorkOne on your behalf</li>`,
        `</ol>`,
        `<p>Your reference number: <strong>${refNumber}</strong></p>`,
        `<p>Questions? Reply to this email or call us.</p>`,
        `<p>— Elevate for Humanity</p>`,
      ].join(''),
    }).catch((err) => logger.error('Failed to send student approval email', err as Error));

    // Send approval notification to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[APPROVED] ${application.first_name} ${application.last_name} — ${programLabel} [${refNumber}]`,
      html: [
        `<h3>Student Enrollment Approved</h3>`,
        `<p style="color:green"><strong>All 9 verification requirements passed.</strong></p>`,
        `<table style="border-collapse:collapse;width:100%;max-width:500px">`,
        `<tr><td style="padding:6px;font-weight:bold">Name</td><td style="padding:6px">${application.first_name} ${application.last_name}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px"><a href="mailto:${application.email}">${application.email}</a></td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Program</td><td style="padding:6px">${programLabel}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Reference</td><td style="padding:6px">${refNumber}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Status</td><td style="padding:6px;color:green"><strong>APPROVED — All requirements verified</strong></td></tr>`,
        `</table>`,
        `<p>Verified: profile, enrollment agreement, handbook agreement, FERPA consent, handbook policies, government ID, SSN card, transfer hours, onboarding steps.</p>`,
        `<p><a href="${SITE_URL}/admin/applications">View in Admin Dashboard</a></p>`,
      ].join(''),
    }).catch((err) => logger.error('Failed to send admin approval email', err as Error));

    // Mark as emailed so we don't send duplicates
    await supabase
      .from('onboarding_progress')
      .update({ status: 'approval_emailed' })
      .eq('user_id', user.id);

    logger.info('Approval emails sent', { userId: user.id, email: application.email });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Approval email route failed', error as Error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
