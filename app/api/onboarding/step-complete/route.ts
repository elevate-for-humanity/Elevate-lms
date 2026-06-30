import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

const STEP_LABELS: Record<string, string> = {
  profile: 'Profile Completed',
  agreements: 'Agreements Signed',
  handbook: 'Handbook Acknowledged',
  documents: 'Documents Uploaded',
};

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step } = await request.json();

    if (!step || !STEP_LABELS[step]) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Get student info from application
    const { data: app } = await supabase
      .from('applications')
      .select('first_name, last_name, email, program_interest')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!app) {
      return NextResponse.json({ error: 'No application found' }, { status: 404 });
    }

    const programLabel = (app.program_interest || 'Unknown Program').replace(/-/g, ' ');
    const stepLabel = STEP_LABELS[step];

    // Check remaining steps from onboarding_progress (new schema: step + completed columns)
    const REQUIRED_STEPS = ['profile', 'agreements', 'handbook', 'documents'];
    const { data: progressRows } = await supabase
      .from('onboarding_progress')
      .select('step, completed')
      .eq('user_id', user.id)
      .in('step', REQUIRED_STEPS);

    const completedSet = new Set(
      (progressRows ?? []).filter((r) => r.completed).map((r) => r.step),
    );
    const completedCount = completedSet.size;
    const totalRequired = REQUIRED_STEPS.length;
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
        `<li>${completedSet.has('profile') ? '✅' : '⬜'} Profile Completed</li>`,
        `<li>${completedSet.has('agreements') ? '✅' : '⬜'} Agreements Signed</li>`,
        `<li>${completedSet.has('handbook') ? '✅' : '⬜'} Handbook Acknowledged</li>`,
        `<li>${completedSet.has('documents') ? '✅' : '⬜'} Documents Uploaded</li>`,
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
