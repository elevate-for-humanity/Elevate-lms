import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

const STEP_LABELS: Record<string, string> = {
  profile: 'Profile Completed',
  agreements: 'Agreements Signed',
  handbook: 'Handbook Acknowledged',
  documents: 'Documents Uploaded',
};

async function _POST(request: NextRequest) {
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step } = await request.json();

    if (!step || !STEP_LABELS[step]) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Get student info from application
    const { data: app } = await db
      .from('applications')
      .select('first_name, last_name, email, program_interest')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'No application found' }, { status: 404 });
    }

    const programLabel = (app.program_interest || 'Unknown Program').replace(/-/g, ' ');
    const stepLabel = STEP_LABELS[step];

    // Check remaining steps from onboarding_progress
    const { data: progress } = await db
      .from('onboarding_progress')
      .select('profile_completed, agreements_completed, handbook_acknowledged, documents_uploaded')
      .eq('user_id', user.id)
      .single();

    const completedSteps = [
      progress?.profile_completed && 'Profile',
      progress?.agreements_completed && 'Agreements',
      progress?.handbook_acknowledged && 'Handbook',
      progress?.documents_uploaded && 'Documents',
    ].filter(Boolean);

    const totalRequired = 4;
    const completedCount = completedSteps.length;
    const remaining = totalRequired - completedCount;

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[ONBOARDING] ${app.first_name} ${app.last_name} — ${stepLabel} (${completedCount}/${totalRequired})`,
      html: [
        `<h3>Onboarding Step Completed</h3>`,
        `<p><strong>${app.first_name} ${app.last_name}</strong> completed: <strong>${stepLabel}</strong></p>`,
        `<table style="border-collapse:collapse;width:100%;max-width:500px">`,
        `<tr><td style="padding:6px;font-weight:bold">Student</td><td style="padding:6px">${app.first_name} ${app.last_name}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px"><a href="mailto:${app.email}">${app.email}</a></td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Program</td><td style="padding:6px">${programLabel}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Step Completed</td><td style="padding:6px;color:#16a34a;font-weight:bold">${stepLabel}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Progress</td><td style="padding:6px">${completedCount} of ${totalRequired} steps complete</td></tr>`,
        `</table>`,
        `<h4>Onboarding Checklist</h4>`,
        `<ul>`,
        `<li>${progress?.profile_completed ? '✅' : '⬜'} Profile Completed</li>`,
        `<li>${progress?.agreements_completed ? '✅' : '⬜'} Agreements Signed</li>`,
        `<li>${progress?.handbook_acknowledged ? '✅' : '⬜'} Handbook Acknowledged</li>`,
        `<li>${progress?.documents_uploaded ? '✅' : '⬜'} Documents Uploaded</li>`,
        `</ul>`,
        remaining === 0
          ? `<p style="color:#16a34a;font-weight:bold">All steps complete — enrollment approval will be triggered automatically.</p>`
          : `<p>${remaining} step${remaining > 1 ? 's' : ''} remaining before enrollment can be approved.</p>`,
        `<p><a href="${SITE_URL}/admin/applications">View in Admin Dashboard</a></p>`,
      ].join(''),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Onboarding step notification failed', error as Error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/onboarding/step-complete', _POST);
