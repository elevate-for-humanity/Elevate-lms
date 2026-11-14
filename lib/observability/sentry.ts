import * as Sentry from '@sentry/nextjs';
import { CorrelationContext } from './correlation';

/**
 * STEP 6D: Sentry integration for observability
 *
 * Tags all events with:
 * - tenant_id
 * - payment_intent_id
 * - stripe_event_id
 * - job_id
 * - correlation_id
 */

interface JobErrorContext {
  jobId: string;
  jobType: string;
  correlationId: string;
  tenantId?: string;
  paymentIntentId?: string;
  stripeEventId?: string;
  attempt?: number;
}

/**
 * Capture job failure with full context
 */
export function captureJobError(error: Error, context: JobErrorContext): void {
  Sentry.withScope((scope) => {
    // Set tags for filtering
    scope.setTag('job_type', context.jobType);
    scope.setTag('correlation_id', context.correlationId);

    if (context.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }
    if (context.paymentIntentId) {
      scope.setTag('payment_intent_id', context.paymentIntentId);
    }
    if (context.stripeEventId) {
      scope.setTag('stripe_event_id', context.stripeEventId);
    }

    // Set extra context
    scope.setExtra('job_id', context.jobId);
    scope.setExtra('attempt', context.attempt || 1);

    // Set fingerprint for grouping
    scope.setFingerprint([context.jobType, error.name, error.message.substring(0, 50)]);

    Sentry.captureException(error);
  });
}

/**
 * Capture webhook error with correlation
 */
export function captureWebhookError(
  error: Error,
  correlation: CorrelationContext,
  eventType: string,
): void {
  Sentry.withScope((scope) => {
    scope.setTag('webhook_event_type', eventType);
    scope.setTag('correlation_id', correlation.correlationId);

    if (correlation.stripeEventId) {
      scope.setTag('stripe_event_id', correlation.stripeEventId);
    }
    if (correlation.paymentIntentId) {
      scope.setTag('payment_intent_id', correlation.paymentIntentId);
    }
    if (correlation.tenantId) {
      scope.setTag('tenant_id', correlation.tenantId);
    }

    scope.setFingerprint(['webhook', eventType, error.name]);

    Sentry.captureException(error);
  });
}

/**
 * Capture dead letter event (high priority)
 */
export function captureDeadLetter(context: JobErrorContext): void {
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('dead_letter', 'true');
    scope.setTag('job_type', context.jobType);
    scope.setTag('correlation_id', context.correlationId);

    if (context.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }

    scope.setExtra('job_id', context.jobId);
    scope.setExtra('max_attempts_reached', true);

    Sentry.captureMessage(`Dead letter: ${context.jobType} job failed after max attempts`, 'error');
  });
}

/**
 * Add breadcrumb for tracing
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Set user context (tenant-scoped)
 */
export function setTenantContext(tenantId: string, userId?: string): void {
  Sentry.setUser({
    id: userId,
    // Don't include email for PII compliance
  });
  Sentry.setTag('tenant_id', tenantId);
}

/**
 * Clear user context
 */
export function clearContext(): void {
  Sentry.setUser(null);
}
