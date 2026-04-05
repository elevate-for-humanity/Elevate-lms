
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { sendApplicationWelcomeEmail } from '@/lib/email/application-welcome';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted:       ['in_review'],
  in_review:       ['approved', 'rejected'],
  approved:        ['ready_to_enroll', 'rejected'],
  ready_to_enroll: ['enrolled', 'rejected'],
  rejected:        [],
  enrolled:        [],
  pending_workone: ['in_review', 'rejected'],
  waitlisted:      ['in_review', 'rejected'],
};

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = createAdminClient();
  if (!supabase || !db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    return NextResponse.json(
      { error: 'application_id and next_status required' },
      { status: 400 },
    );
  }

  // Fetch application
  const { data: application, error: fetchError } = await db
    .from('applications')
    .select('id, status, user_id, program_slug, program_interest, email, first_name, last_name, full_name, funding_verified, payment_received_at, eligibility_status, has_workone_approval')
    .eq('id', application_id)
    .single();

  if (fetchError || !application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const currentStatus = application.status;

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
          error: 'FUNDING_NOT_VERIFIED: cannot move to ready_to_enroll until payment or funding eligibility is confirmed.',
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
      { error: 'Cannot enroll: no user account exists. Run /approve first to create the account, then transition to enrolled.' },
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
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
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
        .single();

      if (enrollError) {
        logger.error('[transition] enrollment insert failed', enrollError);
        await db
          .from('applications')
          .update({ status: currentStatus })
          .eq('id', application_id);
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
      }
      enrollment_id = enrolled?.id ?? null;
    } else {
      enrollment_id = existing.id;
    }
  }

  // Reversal: if moving backward from enrolled, void the enrollment rows
  if (previous_status === 'enrolled' && ['approved', 'rejected'].includes(next_status)) {
    // Void LMS enrollment
    await db
      .from('program_enrollments')
      .update({ enrollment_state: 'voided', status: 'inactive', updated_at: new Date().toISOString() })
      .eq('user_id', application.user_id)
      .eq('program_slug', application.program_slug);

    // Void external enrollment
    await db
      .from('external_program_enrollments')
      .update({ enrollment_state: 'voided', voided_at: new Date().toISOString(), voided_reason: `Application moved to ${next_status}` })
      .eq('user_id', application.user_id)
      .eq('program_slug', application.program_slug);
  }

  // Mandatory audit log — failure is a hard error
  const { error: auditError } = await db.from('audit_logs').insert({
    entity_type: 'application',
    entity_id: application_id,
    action: 'status_transition',
    actor_id: user.id,
    actor_role: profile.role,
    metadata: {
      from: currentStatus,
      to: next_status,
      reason: reason ?? null,
      enrollment_id,
    },
  });

  if (auditError) {
    logger.error('[transition] audit log failed', auditError);
    return NextResponse.json({ error: 'Failed to record audit log' }, { status: 500 });
  }

  // Send welcome + onboarding emails when application moves to in_review.
  // This is the correct trigger — application has been seen by staff,
  // not just submitted by the applicant.
  if (next_status === 'in_review' && application.email) {
    const firstName = application.first_name || application.full_name?.split(' ')[0] || '';
    Promise.allSettled([
      sendApplicationWelcomeEmail({
        to: application.email,
        firstName,
        programSlug: application.program_slug ?? application.program_interest ?? '',
      }),
      sendOnboardingEmail({
        email: application.email,
        name: application.full_name || `${application.first_name ?? ''} ${application.last_name ?? ''}`.trim(),
        program: application.program_slug ?? application.program_interest ?? '',
      }),
    ]).catch(err => logger.warn('[transition] welcome email failed', { err }));
  }

  return NextResponse.json({
    success: true,
    from: currentStatus,
    to: next_status,
    enrollment_id,
  });
}
