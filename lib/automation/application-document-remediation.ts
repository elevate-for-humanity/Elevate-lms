import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

import { runTabularIntelligence } from '@/lib/ai/tabular-intelligence';
import { logAuditEvent } from '@/lib/audit';
import { executeGovernedEllieAction } from '@/lib/ellie/governed-executor';
import { evaluateAndAdvanceApplication } from '@/lib/paris/application-self-service';

const WORKFLOW_KEY = 'application_missing_documents';
const RECHECK_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;
const EMAIL_PREFERENCES = new Set(['email', 'e-mail']);

export type RemediationOutcome =
  | 'resolved'
  | 'sent'
  | 'suppressed'
  | 'escalated'
  | 'failed';

export interface RemediationResult {
  outcome: RemediationOutcome;
  applicationId: string;
  missingDocuments: string[];
  attemptCount: number;
  nextCheckAt?: string | null;
  message?: string;
}

export function documentOnly(items: string[]): string[] {
  return items.filter((item) => item.toLowerCase().includes('document'));
}

export function deterministicMissingDocumentMessage(missingDocuments: string[]): string {
  const list = missingDocuments.map((item) => `- ${item}`).join('\n');
  return [
    'Your application is still missing the following required item(s):',
    list,
    '',
    'Please upload the listed item(s) through your applicant portal. If you already submitted them, no additional action is needed while staff review is pending.',
  ].join('\n');
}

function makeActionKey(applicationId: string, attempt: number, missingDocuments: string[]): string {
  return createHash('sha256')
    .update(`${WORKFLOW_KEY}:${applicationId}:${attempt}:${missingDocuments.slice().sort().join('|')}`)
    .digest('hex');
}

async function buildMessage(application: Record<string, any>, missingDocuments: string[]) {
  const fallback = deterministicMissingDocumentMessage(missingDocuments);
  try {
    const result = await runTabularIntelligence({
      mode: 'generate',
      instruction: 'Write a concise, respectful applicant reminder. State every missing document exactly as supplied. Explain that the applicant should upload the listed items through the applicant portal. Do not add eligibility, funding, approval, denial, or compliance claims.',
      row: {
        applicant_name: [application.first_name, application.last_name].filter(Boolean).join(' '),
        missing_documents: missingDocuments,
      },
    });
    return result.value.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function audit(applicationId: string, metadata: Record<string, unknown>) {
  await logAuditEvent({
    userId: null,
    action: 'autopilot.application_missing_documents',
    resourceType: 'application',
    resourceId: applicationId,
    metadata: { ...metadata, source: 'closed_loop_autopilot' },
  });
}

async function markEscalated(
  db: SupabaseClient,
  applicationId: string,
  triggerType: string,
  missingDocuments: string[],
  attemptCount: number,
  maxAttempts: number,
  reason: string,
) {
  const idempotencyKey = `${WORKFLOW_KEY}:application:${applicationId}`;
  await db.from('automation_followups').upsert({
    workflow_key: WORKFLOW_KEY,
    subject_type: 'application',
    subject_id: applicationId,
    trigger_type: triggerType,
    state: 'escalated',
    detected_condition: { missingDocuments },
    proposed_action: 'send_reminder',
    action_policy: 'AUTO',
    execution_status: 'suppressed',
    attempt_count: attemptCount,
    max_attempts: maxAttempts,
    escalation_status: 'needed',
    failure_reason: reason,
    idempotency_key: idempotencyKey,
    audit_metadata: { rule: 'required_document_presence' },
  }, { onConflict: 'workflow_key,subject_type,subject_id' });
}

export async function remediateMissingApplicationDocuments(
  db: SupabaseClient,
  applicationId: string,
  triggerType = 'scheduled_reconciliation',
): Promise<RemediationResult> {
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: application, error: applicationError } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (applicationError) throw new Error(`Failed to load application: ${applicationError.message}`);
  if (!application) throw new Error(`Application ${applicationId} not found`);

  const decision = await evaluateAndAdvanceApplication(db, application, null);
  const missingDocuments = documentOnly(decision.missing);

  const { data: existing } = await db
    .from('automation_followups')
    .select('*')
    .eq('workflow_key', WORKFLOW_KEY)
    .eq('subject_type', 'application')
    .eq('subject_id', applicationId)
    .maybeSingle();

  const attemptCount = Number(existing?.attempt_count || 0);
  const maxAttempts = Number(existing?.max_attempts || DEFAULT_MAX_ATTEMPTS);

  if (missingDocuments.length === 0) {
    if (existing) {
      await db.from('automation_followups').update({
        state: 'resolved',
        execution_status: 'verified',
        detected_condition: { missingDocuments: [] },
        resolved_at: nowIso,
        next_check_at: null,
        escalation_status: existing.escalation_status === 'created' ? 'closed' : 'none',
        failure_reason: null,
        audit_metadata: { ...(existing.audit_metadata || {}), resolution: 'requirements_satisfied' },
      }).eq('id', existing.id);
    }
    await audit(applicationId, {
      triggerType,
      outcome: 'resolved',
      missingDocuments: [],
      rule: 'required_document_presence',
    });
    return { outcome: 'resolved', applicationId, missingDocuments: [], attemptCount };
  }

  if (!application.user_id) {
    const reason = 'Application has no linked user_id for canonical reminder delivery.';
    await markEscalated(db, applicationId, triggerType, missingDocuments, attemptCount, maxAttempts, reason);
    await audit(applicationId, { triggerType, outcome: 'escalated', missingDocuments, reason: 'missing_user_id' });
    return { outcome: 'escalated', applicationId, missingDocuments, attemptCount };
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', application.user_id)
    .maybeSingle();

  if (!profile?.email) {
    const reason = 'Linked applicant profile has no deliverable email address.';
    await markEscalated(db, applicationId, triggerType, missingDocuments, attemptCount, maxAttempts, reason);
    await audit(applicationId, { triggerType, outcome: 'escalated', missingDocuments, reason: 'missing_contact_destination' });
    return { outcome: 'escalated', applicationId, missingDocuments, attemptCount };
  }

  const contactPreference = String(application.contact_preference || '').trim().toLowerCase();
  if (contactPreference && !EMAIL_PREFERENCES.has(contactPreference)) {
    const reason = `Applicant contact preference is ${contactPreference}; this remediation loop currently supports automatic email only.`;
    await markEscalated(db, applicationId, triggerType, missingDocuments, attemptCount, maxAttempts, reason);
    await audit(applicationId, {
      triggerType,
      outcome: 'escalated',
      missingDocuments,
      reason: 'unsupported_contact_preference',
      contactPreference,
    });
    return { outcome: 'escalated', applicationId, missingDocuments, attemptCount };
  }

  const nextCheckAt = existing?.next_check_at ? new Date(existing.next_check_at) : null;
  if (existing && existing.state !== 'resolved' && nextCheckAt && nextCheckAt.getTime() > now.getTime()) {
    return {
      outcome: 'suppressed',
      applicationId,
      missingDocuments,
      attemptCount,
      nextCheckAt: existing.next_check_at,
    };
  }

  if (attemptCount >= maxAttempts) {
    const reason = `No resolution after ${attemptCount} reminder attempts.`;
    await markEscalated(db, applicationId, triggerType, missingDocuments, attemptCount, maxAttempts, reason);
    await audit(applicationId, { triggerType, outcome: 'escalated', missingDocuments, attemptCount });
    return { outcome: 'escalated', applicationId, missingDocuments, attemptCount };
  }

  const message = await buildMessage(application, missingDocuments);
  const nextAttempt = attemptCount + 1;
  const actionKey = makeActionKey(applicationId, nextAttempt, missingDocuments);
  const idempotencyKey = `${WORKFLOW_KEY}:application:${applicationId}`;

  if (!existing) {
    await db.from('automation_followups').upsert({
      workflow_key: WORKFLOW_KEY,
      subject_type: 'application',
      subject_id: applicationId,
      trigger_type: triggerType,
      state: 'open',
      detected_condition: { missingDocuments },
      proposed_action: 'send_reminder',
      action_policy: 'AUTO',
      execution_status: 'pending',
      attempt_count: attemptCount,
      max_attempts: maxAttempts,
      escalation_status: 'none',
      idempotency_key: idempotencyKey,
      audit_metadata: { rule: 'required_document_presence' },
    }, { onConflict: 'workflow_key,subject_type,subject_id', ignoreDuplicates: true });
  }

  const { data: claimed, error: claimError } = await db
    .from('automation_followups')
    .update({
      state: 'open',
      detected_condition: { missingDocuments },
      proposed_action: 'send_reminder',
      action_policy: 'AUTO',
      execution_status: 'executing',
      last_action_key: actionKey,
      failure_reason: null,
    })
    .eq('workflow_key', WORKFLOW_KEY)
    .eq('subject_type', 'application')
    .eq('subject_id', applicationId)
    .or(`last_action_key.is.null,last_action_key.neq.${actionKey}`)
    .select('id')
    .maybeSingle();

  if (claimError) throw new Error(`Failed to claim remediation action: ${claimError.message}`);
  if (!claimed) {
    return {
      outcome: 'suppressed',
      applicationId,
      missingDocuments,
      attemptCount,
      nextCheckAt: existing?.next_check_at || null,
    };
  }

  let execution;
  try {
    execution = await executeGovernedEllieAction(
      'send_reminder',
      { userId: application.user_id, message },
      db,
      {
        mode: 'autonomous',
        preconditionsVerified: true,
        actorId: null,
        reason: 'Deterministic required-document check found missing required documents.',
      },
    );
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : 'Reminder execution failed';
    const retryAt = new Date(now.getTime() + RECHECK_MS).toISOString();
    await db.from('automation_followups').update({
      state: 'failed',
      execution_status: 'failed',
      attempt_count: nextAttempt,
      last_attempt_at: nowIso,
      last_action_key: null,
      failure_reason: failureReason,
      next_check_at: retryAt,
    }).eq('workflow_key', WORKFLOW_KEY).eq('subject_type', 'application').eq('subject_id', applicationId);
    await audit(applicationId, {
      triggerType,
      outcome: 'failed',
      missingDocuments,
      attemptCount: nextAttempt,
      failureReason,
      retryAt,
    });
    return {
      outcome: 'failed',
      applicationId,
      missingDocuments,
      attemptCount: nextAttempt,
      nextCheckAt: retryAt,
      message: failureReason,
    };
  }

  const notificationIds = Array.isArray(execution.data?.notificationIds)
    ? execution.data.notificationIds.filter((value): value is string => typeof value === 'string')
    : [];

  const { data: queuedNotifications } = notificationIds.length
    ? await db
        .from('notification_outbox')
        .select('id, status, to_email')
        .in('id', notificationIds)
        .in('status', ['queued', 'processing', 'sent'])
    : { data: [] as Array<{ id: string; status: string; to_email: string }> };

  const verified = execution.success
    && notificationIds.length > 0
    && (queuedNotifications?.length || 0) === notificationIds.length;
  const nextCheck = new Date(now.getTime() + RECHECK_MS).toISOString();

  await db.from('automation_followups').update({
    state: verified ? 'waiting' : 'failed',
    execution_status: verified ? 'verified' : 'failed',
    attempt_count: nextAttempt,
    last_attempt_at: nowIso,
    next_check_at: nextCheck,
    failure_reason: verified ? null : 'Reminder action returned without verifiable canonical notification-outbox records.',
    audit_metadata: {
      rule: 'required_document_presence',
      missingDocuments,
      actionKey,
      notificationIds,
      notificationStatuses: (queuedNotifications || []).map((item: { id: string; status: string }) => ({ id: item.id, status: item.status })),
      execution,
    },
  }).eq('workflow_key', WORKFLOW_KEY).eq('subject_type', 'application').eq('subject_id', applicationId);

  await audit(applicationId, {
    triggerType,
    outcome: verified ? 'sent' : 'failed',
    missingDocuments,
    attemptCount: nextAttempt,
    actionPolicy: 'AUTO',
    action: 'send_reminder',
    verification: {
      notificationIds,
      statuses: (queuedNotifications || []).map((item: { status: string }) => item.status),
    },
  });

  return {
    outcome: verified ? 'sent' : 'failed',
    applicationId,
    missingDocuments,
    attemptCount: nextAttempt,
    nextCheckAt: nextCheck,
    message,
  };
}
