import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export const PlatformEventType = {
  IDENTITY_AUTHENTICATED: 'identity.authenticated',
  IDENTITY_ROLE_CHANGED: 'identity.role_changed',
  COMMERCE_CHECKOUT_CREATED: 'commerce.checkout_created',
  COMMERCE_CHECKOUT_COMPLETED: 'commerce.checkout_completed',
  BILLING_SUBSCRIPTION_ACTIVATED: 'billing.subscription_activated',
  BILLING_SUBSCRIPTION_UPDATED: 'billing.subscription_updated',
  BILLING_SUBSCRIPTION_PAST_DUE: 'billing.subscription_past_due',
  BILLING_SUBSCRIPTION_CANCELED: 'billing.subscription_canceled',
  BILLING_PAYMENT_FAILED: 'billing.payment_failed',
  ENTITLEMENT_REFRESHED: 'entitlement.refreshed',
  ENTITLEMENT_GRANTED: 'entitlement.granted',
  ENTITLEMENT_REVOKED: 'entitlement.revoked',
  PROVISIONING_REQUESTED: 'provisioning.requested',
  PROVISIONING_COMPLETED: 'provisioning.completed',
  PROVISIONING_FAILED: 'provisioning.failed',
  APPLICATION_SUBMITTED: 'application.submitted',
  APPLICATION_APPROVED: 'application.approved',
  ENROLLMENT_CONFIRMED: 'enrollment.confirmed',
  ORIENTATION_COMPLETED: 'orientation.completed',
  COURSE_COMPLETED: 'course.completed',
  CERTIFICATE_ISSUED: 'certificate.issued',
  HOST_SHOP_APPROVED: 'host_shop.approved',
  APPRENTICE_ASSIGNED: 'apprentice.assigned',
  TESTING_REGISTRATION_CREATED: 'testing.registration_created',
  WORKFLOW_TRIGGERED: 'workflow.triggered',
} as const;

export type PlatformEventTypeValue =
  (typeof PlatformEventType)[keyof typeof PlatformEventType];

export type PlatformEventCategory =
  | 'identity'
  | 'commerce'
  | 'billing'
  | 'entitlement'
  | 'provisioning'
  | 'application'
  | 'enrollment'
  | 'lms'
  | 'credential'
  | 'workforce'
  | 'testing'
  | 'workflow'
  | 'ai'
  | 'deployment';

export type PlatformEventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type PlatformEventProcessingStatus =
  | 'observed'
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed';

export interface EmitPlatformEventInput {
  eventType: PlatformEventTypeValue | string;
  category: PlatformEventCategory;
  source: string;
  subjectType?: string | null;
  subjectId?: string | null;
  actorId?: string | null;
  actorType?: string | null;
  tenantId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  payload?: Record<string, unknown>;
  message?: string | null;
  severity?: PlatformEventSeverity;
  dispatch?: boolean;
  availableAt?: string | null;
}

export interface PlatformEventWriteResult {
  id: string | null;
  duplicate: boolean;
}

/**
 * Canonical durable event writer for cross-platform orchestration.
 *
 * Business flows should write one stable event here rather than directly
 * triggering multiple downstream systems. Consumers can process `pending`
 * events idempotently; telemetry-only events remain `observed`.
 */
export async function emitPlatformEvent(
  db: SupabaseClient,
  input: EmitPlatformEventInput,
): Promise<PlatformEventWriteResult> {
  const row = {
    event_type: input.eventType,
    category: input.category,
    severity: input.severity ?? 'info',
    source: input.source,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType ?? null,
    subject_id: input.subjectId ?? null,
    subject_type: input.subjectType ?? null,
    tenant_id: input.tenantId ?? null,
    correlation_id: input.correlationId ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    payload: input.payload ?? {},
    message: input.message ?? null,
    resolved: false,
    processing_status: input.dispatch === false ? 'observed' : 'pending',
    available_at: input.availableAt ?? new Date().toISOString(),
  };

  const { data, error } = await db
    .from('platform_events')
    .insert(row)
    .select('id')
    .maybeSingle();

  if (!error) {
    return { id: data?.id ?? null, duplicate: false };
  }

  if (error.code === '23505' && input.idempotencyKey) {
    const { data: existing } = await db
      .from('platform_events')
      .select('id')
      .eq('idempotency_key', input.idempotencyKey)
      .maybeSingle();
    return { id: existing?.id ?? null, duplicate: true };
  }

  logger.error('[orchestration] platform event insert failed', error, {
    eventType: input.eventType,
    category: input.category,
    source: input.source,
    correlationId: input.correlationId,
  });
  throw error;
}

export async function markPlatformEventProcessing(
  db: SupabaseClient,
  eventId: string,
): Promise<void> {
  const { error } = await db
    .from('platform_events')
    .update({
      processing_status: 'processing',
      attempts: 1,
      last_error: null,
    })
    .eq('id', eventId)
    .eq('processing_status', 'pending');
  if (error) throw error;
}

export async function markPlatformEventProcessed(
  db: SupabaseClient,
  eventId: string,
): Promise<void> {
  const { error } = await db
    .from('platform_events')
    .update({
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
      resolved: true,
      last_error: null,
    })
    .eq('id', eventId);
  if (error) throw error;
}

export async function markPlatformEventFailed(
  db: SupabaseClient,
  eventId: string,
  errorMessage: string,
  retryAt?: Date,
): Promise<void> {
  const { data: current } = await db
    .from('platform_events')
    .select('attempts')
    .eq('id', eventId)
    .maybeSingle();

  const attempts = Number(current?.attempts ?? 0) + 1;
  const { error } = await db
    .from('platform_events')
    .update({
      processing_status: 'failed',
      attempts,
      last_error: errorMessage.slice(0, 4000),
      available_at: (retryAt ?? new Date(Date.now() + 5 * 60_000)).toISOString(),
    })
    .eq('id', eventId);
  if (error) throw error;
}
