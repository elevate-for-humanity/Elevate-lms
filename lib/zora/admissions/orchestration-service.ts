/**
 * ZORA admissions orchestration over the canonical public.applications authority.
 *
 * PARIS guides the applicant. ZORA monitors the existing application lifecycle,
 * creates follow-up work, and escalates conditions that require humans. It does
 * not own an application table and it never approves applications or transfer
 * hours on its own.
 */

import type { ApplicationEvent } from '@/lib/events/application-events';
import { requireAdminClient } from '@/lib/supabase/admin';

interface CanonicalApplication {
  id: string;
  status: string | null;
  email: string;
  first_name: string;
  last_name: string;
  program_id: string | null;
  program_slug: string | null;
  program_interest: string;
  funding_type: string | null;
  funding_status: string | null;
  funding_verified: boolean;
  has_workone_approval: boolean;
  transfer_hours_claimed: number | null;
  transfer_hours_verified: number | null;
  readiness_status: string | null;
  next_step: string | null;
  updated_at: string | null;
  created_at: string | null;
}

async function fetchApplication(applicationId: string): Promise<CanonicalApplication | null> {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('applications')
    .select(
      'id,status,email,first_name,last_name,program_id,program_slug,program_interest,funding_type,funding_status,funding_verified,has_workone_approval,transfer_hours_claimed,transfer_hours_verified,readiness_status,next_step,updated_at,created_at',
    )
    .eq('id', applicationId)
    .maybeSingle();
  if (error) {
    console.error('zora.application.fetch.failed', error.message);
    return null;
  }
  return data as CanonicalApplication | null;
}

async function ensureReminder(input: {
  applicationId: string;
  type: string;
  note: string;
  dueInHours: number;
}): Promise<void> {
  const db = await requireAdminClient();
  const { data: existing } = await db
    .from('follow_up_reminders')
    .select('id')
    .eq('application_id', input.applicationId)
    .eq('type', input.type)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();
  if (existing?.id) return;

  const dueAt = new Date(Date.now() + input.dueInHours * 60 * 60 * 1000).toISOString();
  const { error } = await db.from('follow_up_reminders').insert({
    application_id: input.applicationId,
    type: input.type,
    note: input.note,
    due_at: dueAt,
    status: 'pending',
  });
  if (error) console.error('zora.reminder.create.failed', error.message);
}

async function completeReminder(applicationId: string, type?: string): Promise<void> {
  const db = await requireAdminClient();
  let query = db
    .from('follow_up_reminders')
    .update({ status: 'completed' })
    .eq('application_id', applicationId)
    .eq('status', 'pending');
  if (type) query = query.eq('type', type);
  await query;
}

async function updateApplicationReviewState(
  applicationId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const db = await requireAdminClient();
  const { error } = await db
    .from('applications')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  if (error) console.error('zora.application.update.failed', error.message);
}

async function queueHumanReview(
  application: CanonicalApplication,
  reason: string,
  type = 'human_review_required',
) {
  await ensureReminder({ applicationId: application.id, type, note: reason, dueInHours: 24 });
  await updateApplicationReviewState(application.id, {
    next_step: reason,
    ...(application.status === 'submitted' ? { status: 'under_review' } : {}),
  });
}

function fundingNeedsHumanReview(application: CanonicalApplication): boolean {
  const funding = (application.funding_type || '').toLowerCase();
  if (!funding) return false;
  const thirdParty = ['wioa', 'wrg', 'workforce', 'employer', 'grant', 'scholarship', 'vr'];
  return thirdParty.some((value) => funding.includes(value)) && !application.funding_verified;
}

function transferHoursNeedReview(application: CanonicalApplication): boolean {
  const claimed = Math.max(0, application.transfer_hours_claimed || 0);
  const verified = Math.max(0, application.transfer_hours_verified || 0);
  return claimed > 0 && verified < claimed;
}

/**
 * Main ZORA application event handler.
 *
 * All mutations are advisory/review-state mutations only. Approval and enrollment
 * remain exclusively in lib/enrollment/approve.ts and the Admin approval route.
 */
export async function runZoraOrchestration(event: ApplicationEvent): Promise<void> {
  const applicationId = 'applicationId' in event ? event.applicationId : null;
  if (!applicationId) return;

  const application = await fetchApplication(applicationId);
  if (!application) {
    console.error('zora.application.not_found', applicationId);
    return;
  }

  switch (event.type) {
    case 'application.created':
    case 'application.submitted': {
      await ensureReminder({
        applicationId,
        type: 'admissions_review',
        note: 'Review the submitted application for completeness and program requirements.',
        dueInHours: 24,
      });
      if (fundingNeedsHumanReview(application)) {
        await ensureReminder({
          applicationId,
          type: 'funding_review',
          note: 'Third-party funding was requested and requires authorized verification.',
          dueInHours: 24,
        });
      }
      if (transferHoursNeedReview(application)) {
        await ensureReminder({
          applicationId,
          type: 'transfer_hours_review',
          note: 'Claimed apprenticeship transfer hours require supporting evidence and sponsor verification.',
          dueInHours: 24,
        });
      }
      break;
    }

    case 'document.uploaded':
      await ensureReminder({
        applicationId,
        type: 'document_review',
        note: 'An applicant document was uploaded and requires authorized review before acceptance.',
        dueInHours: 24,
      });
      break;

    case 'document.rejected':
      await updateApplicationReviewState(applicationId, {
        next_step: `Applicant document needs correction: ${event.reason}`,
      });
      await ensureReminder({
        applicationId,
        type: 'document_correction',
        note: `Document needs correction: ${event.reason}`,
        dueInHours: 48,
      });
      break;

    case 'document.status_changed':
      if (['approved', 'accepted'].includes(event.newStatus.toLowerCase())) {
        await completeReminder(applicationId, 'document_review');
      }
      break;

    case 'funding.updated':
      if (fundingNeedsHumanReview(application)) {
        await ensureReminder({
          applicationId,
          type: 'funding_review',
          note: 'Funding information changed and requires authorized verification.',
          dueInHours: 24,
        });
      }
      break;

    case 'funding.approved':
      await completeReminder(applicationId, 'funding_review');
      break;

    case 'funding.denied':
      await queueHumanReview(
        application,
        `Funding decision requires applicant follow-up: ${event.reason}`,
        'funding_follow_up',
      );
      break;

    case 'admissions.decision.recorded':
      // The decision route owns the actual state transition. ZORA only reconciles
      // follow-up tasks and never independently marks an application approved.
      if (event.decision === 'ACCEPTED') {
        await completeReminder(applicationId, 'admissions_review');
      } else if (event.decision === 'REJECTED' || event.decision === 'WAITLISTED') {
        await completeReminder(applicationId);
      }
      break;

    case 'application.ready-to-enroll':
      await ensureReminder({
        applicationId,
        type: 'final_enrollment_review',
        note: 'Application is ready for authorized final enrollment review.',
        dueInHours: 24,
      });
      break;

    case 'application.enrolled':
      await completeReminder(applicationId);
      break;

    case 'application.status.changed': {
      const needsReview = new Set([
        'pending_funding',
        'pending_admin_review',
        'pending_workone',
        'funding_review',
        'in_review',
        'under_review',
      ]);
      if (needsReview.has(event.newStatus)) {
        await ensureReminder({
          applicationId,
          type: 'application_follow_up',
          note: `Application is ${event.newStatus} and requires staff follow-up.`,
          dueInHours: 24,
        });
      }
      break;
    }

    case 'task.overdue':
      await queueHumanReview(application, 'An application follow-up task is overdue.', 'overdue_follow_up');
      break;

    case 'task.created':
    case 'task.completed':
    case 'note.added':
      break;
  }
}
