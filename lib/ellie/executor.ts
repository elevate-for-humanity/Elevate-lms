/**
 * Ellie action executor.
 *
 * Each handler receives the action params and a Supabase admin client.
 * Returns { success, message, data? }.
 * Throws on unrecoverable errors — the caller writes to audit_logs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EllieActionType } from './actions';

export interface ExecuteResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

type Params = Record<string, unknown>;

// ── Individual handlers ───────────────────────────────────────────────────────

async function sendReminder(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const userIds = (params.userIds as string[]) ?? (params.userId ? [params.userId as string] : []);
  if (!userIds.length) return { success: false, message: 'No user IDs provided.' };

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (!profiles?.length) return { success: false, message: 'No matching profiles found.' };

  // Insert delivery_logs rows — the existing email automation picks these up
  const rows = profiles.map((p: { id: string; full_name: string; email: string }) => ({
    channel: 'email',
    template_name: 'ellie_reminder',
    recipient: p.email,
    recipient_name: p.full_name,
    status: 'queued',
    metadata: { triggered_by: 'ellie', message: params.message ?? 'You have been sent a reminder from your program coordinator.' },
  }));

  const { error } = await db.from('delivery_logs').insert(rows);
  if (error) throw new Error(`Failed to queue reminders: ${error.message}`);

  return {
    success: true,
    message: `${profiles.length} reminder${profiles.length !== 1 ? 's' : ''} queued for delivery.`,
    data: { count: profiles.length, recipients: profiles.map((p: { full_name: string }) => p.full_name) },
  };
}

async function flagAtRisk(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const enrollmentIds = (params.enrollmentIds as string[]) ?? (params.enrollmentId ? [params.enrollmentId as string] : []);
  if (!enrollmentIds.length) return { success: false, message: 'No enrollment IDs provided.' };

  const { error, count } = await db
    .from('program_enrollments')
    .update({ status: 'at_risk', at_risk_reason: params.reason ?? 'Flagged by Ellie', at_risk_flagged_at: new Date().toISOString() })
    .in('id', enrollmentIds)
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error(`Failed to flag enrollments: ${error.message}`);
  return { success: true, message: `${count ?? enrollmentIds.length} enrollment(s) flagged as at-risk.` };
}

async function unflagAtRisk(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const enrollmentIds = (params.enrollmentIds as string[]) ?? (params.enrollmentId ? [params.enrollmentId as string] : []);
  if (!enrollmentIds.length) return { success: false, message: 'No enrollment IDs provided.' };

  const { error, count } = await db
    .from('program_enrollments')
    .update({ status: 'active', at_risk_reason: null, at_risk_flagged_at: null })
    .in('id', enrollmentIds)
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error(`Failed to clear at-risk flags: ${error.message}`);
  return { success: true, message: `${count ?? enrollmentIds.length} enrollment(s) cleared.` };
}

async function approveApplication(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { applicationId, studentName } = params as { applicationId: string; studentName?: string };
  if (!applicationId) return { success: false, message: 'No application ID provided.' };

  const { error } = await db
    .from('applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) throw new Error(`Failed to approve application: ${error.message}`);
  return { success: true, message: `Application for ${studentName ?? applicationId} approved.` };
}

async function rejectApplication(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { applicationId, studentName, reason } = params as { applicationId: string; studentName?: string; reason?: string };
  if (!applicationId) return { success: false, message: 'No application ID provided.' };

  const { error } = await db
    .from('applications')
    .update({ status: 'rejected', rejection_reason: reason ?? 'Rejected via Ellie', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) throw new Error(`Failed to reject application: ${error.message}`);
  return { success: true, message: `Application for ${studentName ?? applicationId} rejected.` };
}

async function approveProgramHolder(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { programHolderId, orgName } = params as { programHolderId: string; orgName?: string };
  if (!programHolderId) return { success: false, message: 'No program holder ID provided.' };

  const { error } = await db
    .from('program_holder_profiles')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', programHolderId);

  if (error) throw new Error(`Failed to approve program holder: ${error.message}`);
  return { success: true, message: `Program holder ${orgName ?? programHolderId} approved and activated.` };
}

async function rejectProgramHolder(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { programHolderId, orgName, reason } = params as { programHolderId: string; orgName?: string; reason?: string };
  if (!programHolderId) return { success: false, message: 'No program holder ID provided.' };

  const { error } = await db
    .from('program_holder_profiles')
    .update({ status: 'rejected', rejection_reason: reason ?? 'Rejected via Ellie', reviewed_at: new Date().toISOString() })
    .eq('id', programHolderId);

  if (error) throw new Error(`Failed to reject program holder: ${error.message}`);
  return { success: true, message: `Program holder ${orgName ?? programHolderId} rejected.` };
}

async function issueCertificate(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { enrollmentId, studentName } = params as { enrollmentId: string; studentName?: string };
  if (!enrollmentId) return { success: false, message: 'No enrollment ID provided.' };

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('user_id, program_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) return { success: false, message: 'Enrollment not found.' };

  const { error } = await db.from('program_completion_certificates').insert({
    user_id: enrollment.user_id,
    program_id: enrollment.program_id,
    enrollment_id: enrollmentId,
    issued_at: new Date().toISOString(),
    issued_by: 'ellie',
  });

  if (error) throw new Error(`Failed to issue certificate: ${error.message}`);
  return { success: true, message: `Certificate issued for ${studentName ?? enrollmentId}.` };
}

async function sendMagicLink(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { email, name } = params as { email: string; name?: string };
  if (!email) return { success: false, message: 'No email provided.' };

  // Queue via delivery_logs — the email worker handles OTP generation
  const { error } = await db.from('delivery_logs').insert({
    channel: 'email',
    template_name: 'magic_link',
    recipient: email,
    recipient_name: name ?? email,
    status: 'queued',
    metadata: { triggered_by: 'ellie' },
  });

  if (error) throw new Error(`Failed to queue magic link: ${error.message}`);
  return { success: true, message: `Magic link queued for ${name ?? email}.` };
}

async function runWorkflow(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { workflowId, workflowName } = params as { workflowId: string; workflowName?: string };
  if (!workflowId) return { success: false, message: 'No workflow ID provided.' };

  const { error } = await db.from('workflow_runs').insert({
    workflow_id: workflowId,
    status: 'pending',
    triggered_by: 'ellie',
    started_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to trigger workflow: ${error.message}`);
  return { success: true, message: `Workflow "${workflowName ?? workflowId}" triggered.` };
}

// navigate is client-side only — executor is a no-op
async function navigate(params: Params): Promise<ExecuteResult> {
  return { success: true, message: `Navigate to ${params.url}`, data: { url: params.url as string } };
}

async function assignCaseManager(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { enrollmentId, caseManagerId, studentName, caseManagerName } = params as {
    enrollmentId?: string;
    caseManagerId: string;
    studentName?: string;
    caseManagerName?: string;
  };

  if (!caseManagerId) return { success: false, message: 'No case manager ID provided.' };

  // Verify the case manager exists
  const { data: cm } = await db
    .from('case_managers')
    .select('id, name, email')
    .eq('id', caseManagerId)
    .single();

  if (!cm) return { success: false, message: `Case manager ${caseManagerId} not found.` };

  if (enrollmentId) {
    // Assign via program_enrollments.assigned_staff_id
    const { error } = await db
      .from('program_enrollments')
      .update({ assigned_staff_id: caseManagerId })
      .eq('id', enrollmentId);

    if (error) throw new Error(`Failed to assign case manager: ${error.message}`);

    // Also upsert a case_manager_assignments row if there's a linked application
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('id, user_id')
      .eq('id', enrollmentId)
      .single();

    if (enrollment) {
      const { data: app } = await db
        .from('applications')
        .select('id')
        .eq('user_id', enrollment.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (app) {
        await db.from('case_manager_assignments').upsert(
          { application_id: app.id, case_manager_id: caseManagerId },
          { onConflict: 'application_id' },
        ).then(() => {}, () => {});
      }
    }

    return {
      success: true,
      message: `${caseManagerName ?? cm.name} assigned to ${studentName ?? enrollmentId}.`,
      data: { caseManagerName: cm.name, caseManagerEmail: cm.email },
    };
  }

  return { success: false, message: 'No enrollment ID provided — cannot assign case manager.' };
}

async function scheduleExam(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const {
    userId, firstName, lastName, email, examType, examName,
    preferredDate, preferredTime, notes,
  } = params as {
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    examType: string;
    examName?: string;
    preferredDate: string;
    preferredTime?: string;
    notes?: string;
  };

  if (!firstName || !lastName || !email) {
    return { success: false, message: 'firstName, lastName, and email are required to schedule an exam.' };
  }
  if (!examType) return { success: false, message: 'examType is required.' };
  if (!preferredDate) return { success: false, message: 'preferredDate is required (YYYY-MM-DD).' };

  const { data, error } = await db
    .from('exam_bookings')
    .insert({
      user_id: userId ?? null,
      first_name: firstName,
      last_name: lastName,
      email,
      exam_type: examType,
      exam_name: examName ?? examType,
      preferred_date: preferredDate,
      preferred_time: preferredTime ?? null,
      notes: notes ?? 'Scheduled via Ellie',
      status: 'pending',
      payment_status: 'unpaid',
      booking_type: 'individual',
    })
    .select('id, confirmation_code')
    .single();

  if (error) throw new Error(`Failed to create exam booking: ${error.message}`);

  return {
    success: true,
    message: `Exam booking created for ${firstName} ${lastName} — ${examName ?? examType} on ${preferredDate}.`,
    data: { bookingId: data?.id, confirmationCode: data?.confirmation_code },
  };
}

async function cancelExam(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { bookingId, reason } = params as { bookingId: string; reason?: string };

  if (!bookingId) return { success: false, message: 'No booking ID provided.' };

  // Load the booking first to confirm it exists and is cancellable
  const { data: booking } = await db
    .from('exam_bookings')
    .select('id, first_name, last_name, email, exam_name, exam_type, status')
    .eq('id', bookingId)
    .single();

  if (!booking) return { success: false, message: `Exam booking ${bookingId} not found.` };

  if (booking.status === 'cancelled') {
    return { success: false, message: `Booking for ${booking.first_name} ${booking.last_name} is already cancelled.` };
  }

  const { error } = await db
    .from('exam_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason ?? 'Cancelled via Ellie',
    })
    .eq('id', bookingId);

  if (error) throw new Error(`Failed to cancel exam booking: ${error.message}`);

  // Queue a cancellation notification
  await db.from('delivery_logs').insert({
    channel: 'email',
    template_name: 'exam_booking_cancelled',
    recipient: booking.email,
    recipient_name: `${booking.first_name} ${booking.last_name}`,
    status: 'queued',
    metadata: {
      triggered_by: 'ellie',
      booking_id: bookingId,
      exam_name: booking.exam_name ?? booking.exam_type,
      reason: reason ?? 'Cancelled by administrator',
    },
  }).then(() => {}, () => {});

  return {
    success: true,
    message: `Exam booking for ${booking.first_name} ${booking.last_name} (${booking.exam_name ?? booking.exam_type}) cancelled. Notification queued.`,
  };
}

// ── Dispatch table ────────────────────────────────────────────────────────────

const HANDLERS: Record<EllieActionType, (params: Params, db: SupabaseClient) => Promise<ExecuteResult>> = {
  send_reminder:          sendReminder,
  flag_at_risk:           flagAtRisk,
  unflag_at_risk:         unflagAtRisk,
  approve_application:    approveApplication,
  reject_application:     rejectApplication,
  approve_program_holder: approveProgramHolder,
  reject_program_holder:  rejectProgramHolder,
  issue_certificate:      issueCertificate,
  send_magic_link:        sendMagicLink,
  assign_case_manager:    assignCaseManager,
  schedule_exam:          scheduleExam,
  cancel_exam:            cancelExam,
  run_workflow:           runWorkflow,
  navigate,
};

export async function executeEllieAction(
  actionType: EllieActionType,
  params: Params,
  db: SupabaseClient,
): Promise<ExecuteResult> {
  const handler = HANDLERS[actionType];
  if (!handler) return { success: false, message: `Unknown action type: ${actionType}` };
  return handler(params, db);
}
