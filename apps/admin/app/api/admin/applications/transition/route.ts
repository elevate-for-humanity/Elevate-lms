import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { barberOnboardingEmail } from '@/lib/email/templates/barber-onboarding';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted:           ['scheduled', 'in_review', 'under_review', 'rejected'],
  scheduled:           ['attended_orientation', 'in_review', 'under_review', 'rejected'],
  in_review:           ['under_review', 'approved', 'rejected'],
  under_review:        ['approved', 'rejected'],
  approved:            ['ready_to_enroll', 'rejected'],
  ready_to_enroll:     ['enrolled', 'rejected'],
  rejected:            [],
  // Post-enrollment lifecycle — required for WIOA performance reporting (ETA-9173)
  enrolled:            ['active_apprentice', 'attended_orientation', 'withdrawn'],
  attended_orientation:['active_apprentice', 'assigned', 'scheduled', 'rejected'],
  active_apprentice:   ['assigned', 'completed', 'withdrawn'],
  assigned:            ['placed', 'active_apprentice', 'rejected'],
  completed:           ['placed', 'exited'],
  placed:              ['retained', 'exited'],
  retained:            [],
  withdrawn:           [],
  exited:              [],
  // Holding states
  pending_workone:     ['in_review', 'under_review', 'rejected'],
  waitlisted:          ['in_review', 'under_review', 'rejected'],
};

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const db = await requireAdminClient();
  if (!supabase || !db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let application_id: string;
  let next_status: string;
  let reason: string | undefined;
  try {
    const body = await req.json();
    application_id = body.application_id;
    next_status = body.next_status ?? body.new_status;
    reason = body.reason;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!application_id || !next_status) {
    return NextResponse.json({ error: 'application_id and next_status required' }, { status: 400 });
  }

  // Fetch application
  const { data: application, error: fetchError } = await db
    .from('applications')
    .select(
      'id, status, user_id, program_slug, program_interest, email, first_name, last_name, full_name, funding_verified, payment_received_at, eligibility_status, has_workone_approval',
    )
    .eq('id', application_id)
    .maybeSingle();

  if (fetchError || !application) {
    return NextResponse.json({ error: 'Requested application is unavailable' }, { status: 404 });
  }

  const currentStatus = application.status;
  const previousStatus = currentStatus; // alias for reversal logic below
  const firstName = application.first_name || application.full_name?.split(' ')[0] || 'there';
  const isBarber = (application.program_slug ?? application.program_interest ?? '').includes(
    'barber',
  );

  // Validate transition
  if (!VALID_TRANSITIONS[currentStatus]?.includes(next_status)) {
    return NextResponse.json(
      {
        error: `Invalid transition: ${currentStatus} → ${next_status}`,
        allowed_next: VALID_TRANSITIONS[currentStatus] ?? [],
      },
      { status: 422 },
    );
  }

  // Funding gate on approved → ready_to_enroll
  // This prevents bypassing financial verification via the transition route
  if (next_status === 'ready_to_enroll') {
    const isFunded =
      application.funding_verified === true ||
      application.payment_received_at != null ||
      (application.eligibility_status === 'approved' && application.has_workone_approval === true);

    if (!isFunded) {
      return NextResponse.json(
        {
          error:
            'FUNDING_NOT_VERIFIED: cannot move to ready_to_enroll until payment or funding eligibility is confirmed.',
          funding_state: {
            funding_verified: application.funding_verified,
            payment_received_at: application.payment_received_at,
            eligibility_status: application.eligibility_status,
            has_workone_approval: application.has_workone_approval,
          },
        },
        { status: 422 },
      );
    }
  }

  // Hard block: enrolled requires user_id
  if (next_status === 'enrolled' && !application.user_id) {
    return NextResponse.json(
      {
        error:
          'Cannot enroll: no user account exists. Run /approve first to create the account, then transition to enrolled.',
      },
      { status: 422 },
    );
  }

  // Update status
  const { error: updateError } = await db
    .from('applications')
    .update({ status: next_status, updated_at: new Date().toISOString() })
    .eq('id', application_id);

  if (updateError) {
    logger.error('[transition] status update failed', updateError);
    return safeInternalError(updateError, 'Status update failed');
  }

  // Idempotent enrollment on enrolled
  let enrollment_id: string | null = null;
  if (next_status === 'enrolled') {
    const { data: existing } = await db
      .from('program_enrollments')
      .select('id')
      .eq('user_id', application.user_id)
      .eq('program_slug', application.program_slug)
      .maybeSingle();

    if (!existing) {
      const { data: enrolled, error: enrollError } = await db
        .from('program_enrollments')
        .insert({
          user_id: application.user_id,
          program_slug: application.program_slug,
          enrollment_state: 'active',
          status: 'active',
          source: 'admin-transition',
        })
        .select('id')
        .maybeSingle();

      if (enrollError) {
        logger.error('[transition] enrollment insert failed', enrollError);
        await db.from('applications').update({ status: currentStatus }).eq('id', application_id);
        return safeInternalError(enrollError, 'Enrollment creation failed');
      }
      enrollment_id = enrolled?.id ?? null;
    } else {
      enrollment_id = existing.id;
    }
  }

  // Email triggers — fire after DB update, non-blocking
  if (application.email) {
    try {
      if (next_status === 'in_review' && isBarber) {
        // Barber applicants: send onboarding steps email
        const tpl = barberOnboardingEmail({
          firstName,
          programName: 'Barber Apprenticeship',
          applicantEmail: application.email,
        });
        await sendEmail({ to: application.email, subject: tpl.subject, html: tpl.html });
        await db
          .from('applications')
          .update({ onboarding_sent_at: new Date().toISOString() })
          .eq('id', application_id);
      } else if (next_status === 'rejected') {
        // Rejection email — all program types
        const programName =
          application.program_slug || application.program_interest || 'the program';
        await sendEmail({
          to: [application.email],
          from: `${PLATFORM_DEFAULTS.orgName} <info@${PLATFORM_DEFAULTS.canonicalDomain}>`,
          subject: `Update on Your Application — ${PLATFORM_DEFAULTS.orgName}`,
          html: `<p>Hi ${firstName},</p>
<p>Thank you for your interest in <strong>${programName}</strong> at Elevate for Humanity.</p>
<p>After careful review, we are unable to move forward with your application at this time${reason ? ': ' + reason : '.'}</p>
<p>We encourage you to reapply in the future or explore other programs we offer at <a href="${PLATFORM_DEFAULTS.siteUrl}/programs">${PLATFORM_DEFAULTS.canonicalDomain}/programs</a>.</p>
<p>If you have questions, please contact us at <a href="mailto:info@elevateforhumanity.org">info@elevateforhumanity.org</a>.</p>
<br/><p>Warm regards,<br/>Elevate for Humanity Team</p>`,
        });
      } else if (next_status === 'approved') {
        // Generic approval email for non-barber programs
        if (!isBarber) {
          await sendEmail({
            to: [application.email],
            from: `${PLATFORM_DEFAULTS.orgName} <info@${PLATFORM_DEFAULTS.canonicalDomain}>`,
            subject: `Your Application Has Been Approved — ${PLATFORM_DEFAULTS.orgName}`,
            html: `<p>Hi ${firstName},</p>
<p>Congratulations! Your application for <strong>${application.program_slug || application.program_interest || 'the program'}</strong> has been <strong>approved</strong>.</p>
<p>Please log in to your portal to complete enrollment:</p>
<p><a href="${PLATFORM_DEFAULTS.siteUrl}/learner/dashboard">Access Your Portal →</a></p>
<p>Questions? Contact us at <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@elevateforhumanity.org</a>.</p>
<br/><p>Warm regards,<br/>Elevate for Humanity Team</p>`,
          });
        }
      }
    } catch (emailErr) {
      // Email failure must not roll back the status change
      logger.error('[transition] email send failed', emailErr as Error, {
        application_id,
        next_status,
      });
    }
  }

  // Reversal: if moving backward from enrolled, void the enrollment rows
  if (previousStatus === 'enrolled' && ['approved', 'rejected'].includes(next_status)) {
    // Void LMS enrollment
    await db
      .from('program_enrollments')
      .update({
        enrollment_state: 'voided',
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', application.user_id)
      .eq('program_slug', application.program_slug);

    // Void external enrollment
    await db
      .from('external_program_enrollments')
      .update({
        enrollment_state: 'voided',
        voided_at: new Date().toISOString(),
        voided_reason: `Application moved to ${next_status}`,
      })
      .eq('user_id', application.user_id)
      .eq('program_slug', application.program_slug);
  }

  // Mandatory audit log — failure is a hard error
  const { error: auditError } = await db.from('audit_logs').insert({
    entity_type: 'application',
    entity_id: application_id,
    action: 'status_transition',
    actor_id: auth.id,
    actor_role: auth.role,
    metadata: {
      from: currentStatus,
      to: next_status,
      reason: reason ?? null,
      enrollment_id,
    },
  });

  if (auditError) {
    logger.error('[transition] audit log failed', auditError);
    return safeInternalError(auditError, 'Audit log failed');
  }

  return NextResponse.json({
    success: true,
    from: currentStatus,
    to: next_status,
    enrollment_id,
  });
}
