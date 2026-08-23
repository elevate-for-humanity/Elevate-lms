import type { SupabaseClient } from '@supabase/supabase-js';

import { issueProgramCertificate } from '@/lib/certificates/compiler';
import type { EllieActionType } from './actions';
import { assertActionPolicy, type ActionExecutionContext } from './action-policy';
import { executeEllieAction } from './executor';

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function executeCanonicalReminder(
  params: Record<string, unknown>,
  db: SupabaseClient,
) {
  const userIds = Array.isArray(params.userIds)
    ? params.userIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : text(params.userId)
      ? [text(params.userId)!]
      : [];

  if (!userIds.length) return { success: false, message: 'No user IDs provided.' };

  const { data: profiles, error: profileError } = await db
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (profileError) throw new Error(`Failed to load reminder recipients: ${profileError.message}`);
  if (!profiles?.length) return { success: false, message: 'No matching profiles found.' };

  const message = text(params.message) || 'You have an action waiting in your Elevate account.';
  const rows = profiles
    .filter((profile: { email?: string | null }) => Boolean(profile.email))
    .map((profile: { id: string; full_name?: string | null; email: string }) => ({
      to_email: profile.email,
      channel: 'email',
      template_key: 'ellie_reminder',
      template_data: {
        recipient_name: profile.full_name || 'there',
        message,
      },
      status: 'queued',
      attempts: 0,
      max_attempts: 5,
      scheduled_for: new Date().toISOString(),
      entity_type: 'profile',
      entity_id: profile.id,
    }));

  if (!rows.length) return { success: false, message: 'No reminder recipients have an email address.' };

  const { data: queued, error } = await db
    .from('notification_outbox')
    .insert(rows)
    .select('id, to_email, status');

  if (error) throw new Error(`Failed to queue reminders: ${error.message}`);

  return {
    success: true,
    message: `${queued?.length || rows.length} reminder(s) queued through the canonical notification outbox.`,
    data: {
      count: queued?.length || rows.length,
      notificationIds: (queued || []).map((item: { id: string }) => item.id),
      recipients: (queued || []).map((item: { to_email: string }) => item.to_email),
    },
  };
}

async function executeCanonicalCertificate(
  params: Record<string, unknown>,
  db: SupabaseClient,
) {
  const userId = text(params.userId);
  const courseId = text(params.courseId);
  const programId = text(params.programId);
  const programSlug = text(params.programSlug);
  const enrollmentId = text(params.enrollmentId);
  const studentName = text(params.studentName);
  const courseTitle = text(params.courseTitle);

  const missing = [
    ['userId', userId],
    ['courseId', courseId],
    ['programId', programId],
    ['programSlug', programSlug],
    ['enrollmentId', enrollmentId],
    ['studentName', studentName],
    ['courseTitle', courseTitle],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    return {
      success: false,
      message: `Certificate request requires canonical completion context: ${missing.join(', ')}. No certificate was issued.`,
      data: { missingFields: missing },
    };
  }

  const result = await issueProgramCertificate(db as never, {
    userId: userId!,
    courseId: courseId!,
    programId: programId!,
    programSlug: programSlug!,
    enrollmentId: enrollmentId!,
    studentName: studentName!,
    studentEmail: text(params.studentEmail),
    courseTitle: courseTitle!,
    requiresFinalExam: params.requiresFinalExam === true,
    minimumHours: typeof params.minimumHours === 'number' ? params.minimumHours : undefined,
    certificateRequirements: params.certificateRequirements as never,
  });

  return {
    success: result.success,
    message: result.success
      ? result.alreadyIssued
        ? 'Certificate already existed; no duplicate was created.'
        : 'Certificate issued through the canonical completion gate.'
      : result.error || 'Certificate gate did not permit issuance.',
    data: {
      certificateId: result.certificateId,
      certificateNumber: result.certificateNumber,
      alreadyIssued: result.alreadyIssued,
    },
  };
}

export async function executeGovernedEllieAction(
  actionType: EllieActionType,
  params: Record<string, unknown>,
  db: SupabaseClient,
  context: ActionExecutionContext,
) {
  const policy = assertActionPolicy(actionType, context);
  const result = actionType === 'issue_certificate'
    ? await executeCanonicalCertificate(params, db)
    : actionType === 'send_reminder'
      ? await executeCanonicalReminder(params, db)
      : await executeEllieAction(actionType, params, db);
  return { ...result, policy: policy.policy, policyReason: policy.reason };
}
