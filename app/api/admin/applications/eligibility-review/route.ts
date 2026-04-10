import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/admin/applications/eligibility-review?application_id=xxx
export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const applicationId = req.nextUrl.searchParams.get('application_id');
  if (!applicationId) return safeError('application_id required', 400);

  const db = createAdminClient();
  if (!db) return safeError('Server error', 500);

  const { data, error } = await db
    .from('application_eligibility_reviews')
    .select('*')
    .eq('application_id', applicationId)
    .single();

  if (error) return safeError('Eligibility review not found', 404);
  return NextResponse.json(data);
}

// PATCH /api/admin/applications/eligibility-review
// Body: { application_id, reviewer_decision, reviewer_notes, enrollment_conditions, condition_deadline }
export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { application_id, reviewer_decision, reviewer_notes, enrollment_conditions, condition_deadline } = body;

  if (!application_id || !reviewer_decision) return safeError('application_id and reviewer_decision required', 400);
  if (!['enroll', 'hold', 'do_not_enroll'].includes(reviewer_decision)) {
    return safeError('reviewer_decision must be enroll, hold, or do_not_enroll', 400);
  }

  const db = createAdminClient();
  if (!db) return safeError('Server error', 500);

  // Map reviewer decision to application status
  const statusMap: Record<string, string> = {
    enroll: 'approved',
    hold: 'pending_workone',
    do_not_enroll: 'rejected',
  };

  const now = new Date().toISOString();

  // Update eligibility review record
  const { error: reviewErr } = await db
    .from('application_eligibility_reviews')
    .update({
      reviewer_decision,
      reviewer_notes: reviewer_notes || null,
      reviewer_name: auth.user?.email || 'admin',
      reviewed_at: now,
      enrollment_conditions: enrollment_conditions || [],
      condition_deadline: condition_deadline || null,
    })
    .eq('application_id', application_id);

  if (reviewErr) return safeInternalError(reviewErr, 'Failed to update eligibility review');

  // Update application status
  const { error: appErr } = await db
    .from('applications')
    .update({
      status: statusMap[reviewer_decision],
      eligibility_status: reviewer_decision === 'enroll' ? 'eligible'
        : reviewer_decision === 'hold' ? 'conditional_review' : 'ineligible',
    })
    .eq('id', application_id);

  if (appErr) logger.error('Failed to update application status', appErr);

  // Send notification email to applicant
  try {
    const { data: app } = await db
      .from('applications')
      .select('first_name, last_name, email')
      .eq('id', application_id)
      .single();

    if (app?.email) {
      const messages: Record<string, { subject: string; body: string }> = {
        enroll: {
          subject: 'Your Application Has Been Approved — Next Steps',
          body: `Hi ${app.first_name},<br/><br/>Your application to Elevate for Humanity has been reviewed and <strong>approved for enrollment</strong>. A team member will contact you shortly with next steps.<br/><br/>${reviewer_notes ? `<strong>Note from our team:</strong> ${reviewer_notes}<br/><br/>` : ''}`,
        },
        hold: {
          subject: 'Your Application — Additional Information Required',
          body: `Hi ${app.first_name},<br/><br/>Your application is currently <strong>on hold</strong> pending additional documentation or case manager confirmation. A team member will contact you with details.<br/><br/>${reviewer_notes ? `<strong>Note from our team:</strong> ${reviewer_notes}<br/><br/>` : ''}`,
        },
        do_not_enroll: {
          subject: 'Your Application — Decision',
          body: `Hi ${app.first_name},<br/><br/>After review, we are unable to move forward with your enrollment at this time. If you believe this is incorrect or would like to discuss alternate options, please contact our team.<br/><br/>${reviewer_notes ? `<strong>Note from our team:</strong> ${reviewer_notes}<br/><br/>` : ''}`,
        },
      };

      const msg = messages[reviewer_decision];
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: app.email, name: `${app.first_name} ${app.last_name}` }], subject: msg.subject }],
          from: { email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' },
          content: [{
            type: 'text/html',
            value: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:20px;">${msg.body}<p>Thank you,<br/><strong>Elevate for Humanity Career &amp; Technical Institute</strong><br/>(317) 314-3757 | info@elevateforhumanity.org</p></body></html>`,
          }],
        }),
      });
    }
  } catch (emailErr) {
    logger.error('Eligibility decision email failed', emailErr);
  }

  return NextResponse.json({ success: true, reviewer_decision });
}
