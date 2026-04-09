
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { hrEmailTemplates, HrEmailStep, HrEmailParams } from '@/lib/email/templates/hr-emails';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 30;

export const dynamic = 'force-dynamic';

/**
 * POST /api/hr/emails
 * Fires a hiring/onboarding email at the specified step.
 *
 * Body: { step: HrEmailStep, params: HrEmailParams, applicationId?: string }
 *
 * Also logs the send to job_applications.notes if applicationId is provided.
 */
async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Require admin or super_admin
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { step: HrEmailStep; params: HrEmailParams; applicationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { step, params, applicationId } = body;

  if (!step || !params?.email || !params?.firstName) {
    return NextResponse.json({ error: 'step, params.email, and params.firstName are required' }, { status: 400 });
  }

  const template = hrEmailTemplates[step];
  if (!template) {
    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  }

  const { from, replyTo, subject, html } = template(params);

  const result = await sendEmail({ to: params.email, from, replyTo, subject, html });

  if (!result.success) {
    logger.error('[HR Email] Send failed:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Log the email send to job_applications if applicationId provided
  if (applicationId) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Email sent: ${step} → ${params.email}`;
    await db
      .from('job_applications')
      .update({
        notes: db.rpc ? logEntry : logEntry, // append via raw update
        updated_at: timestamp,
        status: stepToStatus(step),
      })
      .eq('id', applicationId)
      .then(() => {}); // fire-and-forget
  }

  return NextResponse.json({ success: true, step, to: params.email });
}

/** Map email step → job_applications.status */
function stepToStatus(step: HrEmailStep): string {
  const map: Record<HrEmailStep, string> = {
    application_received: 'applied',
    thank_you_applying: 'applied',
    next_steps: 'assessment_sent',
    interview_scheduled: 'interview_scheduled',
    welcome_aboard: 'offer_accepted',
    hire_letter: 'offer_sent',
    onboarding_start: 'onboarding',
  };
  return map[step] ?? 'applied';
}

export const POST = withApiAudit('/api/hr/emails', _POST);
