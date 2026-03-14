/**
 * Grant Submission Tracker
 * Tracks submission status, timeline, and confirmations
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notifyGrantSubmitted } from './notification-system';

import { logAuditEvent } from '@/lib/audit';

export type SubmissionMethod = 'email' | 'portal' | 'mail' | 'other';
export type SubmissionStatus =
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'under_review'
  | 'awarded'
  | 'rejected'
  | 'withdrawn';

export interface SubmissionRecord {
  id?: string;
  applicationId: string;
  grantId: string;
  entityId: string;
  method: SubmissionMethod;
  status: SubmissionStatus;
  submittedBy: string;
  submittedAt: Date;
  confirmationNumber?: string;
  confirmationReceipt?: string;
  portalUrl?: string;
  trackingNumber?: string;
  notes?: string;
  timeline: SubmissionTimelineEvent[];
}

export interface SubmissionTimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Record grant submission
 */
export async function recordSubmission(
  submission: Omit<SubmissionRecord, 'id' | 'timeline'>
): Promise<SubmissionRecord> {
  const timeline: SubmissionTimelineEvent[] = [
    {
      timestamp: submission.submittedAt,
      event: 'submitted',
      description: `Grant submitted via ${submission.method}`,
      performedBy: submission.submittedBy,
      metadata: {
        method: submission.method,
        confirmationNumber: submission.confirmationNumber,
      },
    },
  ];

  const { data, error }: any = await supabaseAdmin
    .from('grant_submissions')
    .insert({
      application_id: submission.applicationId,
      grant_id: submission.grantId,
      entity_id: submission.entityId,
      method: submission.method,
      status: submission.status,
      submitted_by: submission.submittedBy,
      submitted_at: submission.submittedAt.toISOString(),
      confirmation_number: submission.confirmationNumber,
      confirmation_receipt: submission.confirmationReceipt,
      portal_url: submission.portalUrl,
      tracking_number: submission.trackingNumber,
      notes: submission.notes,
      timeline: timeline,
    })
    .select()
    .single();

  if (error) {
    // Error: $1
    throw error;
  }

  await supabaseAdmin
    .from('grant_applications')
    .update({
      status: 'submitted',
      submitted_at: submission.submittedAt.toISOString(),
    })
    .eq('id', submission.applicationId);

  await notifyGrantSubmitted(
    submission.applicationId,
    submission.submittedBy,
    submission.confirmationNumber
  );

  return {
    id: data.id,
    applicationId: data.application_id,
    grantId: data.grant_id,
    entityId: data.entity_id,
    method: data.method,
    status: data.status,
    submittedBy: data.submitted_by,
    submittedAt: new Date(data.submitted_at),
    confirmationNumber: data.confirmation_number,
    confirmationReceipt: data.confirmation_receipt,
    portalUrl: data.portal_url,
    trackingNumber: data.tracking_number,
    notes: data.notes,
    timeline: data.timeline,
  };
}

/**
 * Add timeline event to submission
 */
export async function addTimelineEvent(
  submissionId: string,
  event: Omit<SubmissionTimelineEvent, 'timestamp'>
): Promise<void> {
  const { data: submission } = await supabaseAdmin
    .from('grant_submissions')
    .select('timeline')
    .eq('id', submissionId)
    .single();

  if (!submission) {
    throw new Error('Submission not found');
  }

  const timeline = submission.timeline || [];
  timeline.push({
    timestamp: new Date(),
    ...event,
  });

  await supabaseAdmin
    .from('grant_submissions')
    .update({ timeline })
    .eq('id', submissionId);
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  notes?: string,
  performedBy?: string
): Promise<void> {
  await supabaseAdmin
    .from('grant_submissions')
    .update({ status, notes })
    .eq('id', submissionId);

  await addTimelineEvent(submissionId, {
    event: 'status_updated',
    description: `Status changed to: ${status}`,
    performedBy,
    metadata: { newStatus: status, notes },
  });
}

/**
 * Record email submission
 */
export async function recordEmailSubmission(
  applicationId: string,
  submittedBy: string,
  emailDetails: {
    to: string;
    subject: string;
    messageId?: string;
    attachments: string[];
  }
): Promise<SubmissionRecord> {
  const { data: app } = await supabaseAdmin
    .from('grant_applications')
    .select('grant_id, entity_id')
    .eq('id', applicationId)
    .single();

  if (!app) {
    throw new Error('Application not found');
  }

  return await recordSubmission({
    applicationId,
    grantId: app.grant_id,
    entityId: app.entity_id,
    method: 'email',
    status: 'submitted',
    submittedBy,
    submittedAt: new Date(),
    confirmationNumber: emailDetails.messageId,
    notes: `Sent to: ${emailDetails.to}\nSubject: ${emailDetails.subject}\nAttachments: ${emailDetails.attachments.join(', ')}`,
  });
}

/**
 * Record portal submission
 */
export async function recordPortalSubmission(
  applicationId: string,
  submittedBy: string,
  portalDetails: {
    portalUrl: string;
    confirmationNumber: string;
    confirmationReceipt?: string;
  }
): Promise<SubmissionRecord> {
  const { data: app } = await supabaseAdmin
    .from('grant_applications')
    .select('grant_id, entity_id')
    .eq('id', applicationId)
    .single();

  if (!app) {
    throw new Error('Application not found');
  }

  return await recordSubmission({
    applicationId,
    grantId: app.grant_id,
    entityId: app.entity_id,
    method: 'portal',
    status: 'submitted',
    submittedBy,
    submittedAt: new Date(),
    confirmationNumber: portalDetails.confirmationNumber,
    confirmationReceipt: portalDetails.confirmationReceipt,
    portalUrl: portalDetails.portalUrl,
  });
}

/**
 * Get submission history for an application
 */
export async function getSubmissionHistory(
  applicationId: string
): Promise<SubmissionRecord | null> {
  const { data, error }: any = await supabaseAdmin
    .from('grant_submissions')
    .select('*')
    .eq('application_id', applicationId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    applicationId: data.application_id,
    grantId: data.grant_id,
    entityId: data.entity_id,
    method: data.method,
    status: data.status,
    submittedBy: data.submitted_by,
    submittedAt: new Date(data.submitted_at),
    confirmationNumber: data.confirmation_number,
    confirmationReceipt: data.confirmation_receipt,
    portalUrl: data.portal_url,
    trackingNumber: data.tracking_number,
    notes: data.notes,
    timeline: data.timeline || [],
  };
}

/**
 * Get all submissions
 */
export async function getAllSubmissions(): Promise<SubmissionRecord[]> {
  const { data, error }: any = await supabaseAdmin
    .from('grant_submissions')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((d) => ({
    id: d.id,
    applicationId: d.application_id,
    grantId: d.grant_id,
    entityId: d.entity_id,
    method: d.method,
    status: d.status,
    submittedBy: d.submitted_by,
    submittedAt: new Date(d.submitted_at),
    confirmationNumber: d.confirmation_number,
    confirmationReceipt: d.confirmation_receipt,
    portalUrl: d.portal_url,
    trackingNumber: d.tracking_number,
    notes: d.notes,
    timeline: d.timeline || [],
  }));
}

/**
 * Check for upcoming deadlines and send reminders
 */
export async function checkDeadlinesAndNotify(): Promise<void> {
  const now = new Date();
  const deadlineChecks = [
    { days: 7, hours: 0 },
    { days: 3, hours: 0 },
    { days: 1, hours: 0 },
    { days: 0, hours: 3 },
  ];

  for (const check of deadlineChecks) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + check.days);
    targetDate.setHours(targetDate.getHours() + check.hours);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: grants } = await supabaseAdmin
      .from('grant_opportunities')
      .select('id, title, due_date')
      .gte('due_date', startOfDay.toISOString())
      .lte('due_date', endOfDay.toISOString());

    if (grants) {
      const { notifyDeadlineApproaching } = await import('./notification-system');
      for (const grant of grants) {
        await notifyDeadlineApproaching(grant.id, check.days || 0);
      }
    }
  }
}
