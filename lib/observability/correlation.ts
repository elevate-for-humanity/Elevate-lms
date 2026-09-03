import type Stripe from 'stripe';

/**
 * STEP 6C: Correlation ID management
 *
 * Every log and audit record must include correlation_id for end-to-end tracing.
 *
 * Priority order:
 * 1. payment_intent_id (if available)
 * 2. stripe_event_id (for webhooks)
 * 3. checkout_session_id
 * 4. Generated UUID (fallback)
 */

export interface CorrelationContext {
  correlationId: string;
  paymentIntentId?: string;
  stripeEventId?: string;
  checkoutSessionId?: string;
  tenantId?: string;
}

/**
 * Extract correlation ID from Stripe event
 */
export function getCorrelationFromStripeEvent(event: Stripe.Event): CorrelationContext {
  const eventObject = event.data.object as Record<string, unknown>;

  // Try to extract payment_intent_id from various event types
  let paymentIntentId: string | undefined;
  let checkoutSessionId: string | undefined;

  if ('payment_intent' in eventObject) {
    paymentIntentId = eventObject.payment_intent as string;
  }

  if (event.type === 'checkout.session.completed') {
    const session = eventObject as Stripe.Checkout.Session;
    paymentIntentId = session.payment_intent as string;
    checkoutSessionId = session.id;
  }

  if (event.type.startsWith('charge.')) {
    const charge = eventObject as Stripe.Charge;
    paymentIntentId = charge.payment_intent as string;
  }

  if (event.type.startsWith('invoice.')) {
    const invoice = eventObject as Stripe.Invoice & { payment_intent?: string | null };
    paymentIntentId = (invoice.payment_intent as string) ?? '';
  }

  // Correlation ID priority: payment_intent > event_id
  const correlationId = paymentIntentId || event.id;

  return {
    correlationId,
    paymentIntentId,
    stripeEventId: event.id,
    checkoutSessionId,
    tenantId: (eventObject.metadata as Record<string, string>)?.tenant_id,
  };
}

/**
 * Extract correlation ID from request
 */
export function getCorrelationFromRequest(request: Request): CorrelationContext {
  const url = new URL(request.url);

  // Check headers first
  const headerCorrelation = request.headers.get('x-correlation-id');
  const headerPaymentIntent = request.headers.get('x-payment-intent-id');

  // Check query params
  const queryCorrelation = url.searchParams.get('correlation_id');
  const queryPaymentIntent = url.searchParams.get('payment_intent_id');

  const paymentIntentId = headerPaymentIntent || queryPaymentIntent || undefined;
  const correlationId =
    headerCorrelation || queryCorrelation || paymentIntentId || generateCorrelationId();

  return {
    correlationId,
    paymentIntentId,
  };
}

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return `cor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a correlation context for a new operation
 */
export function createCorrelationContext(
  paymentIntentId?: string,
  tenantId?: string,
): CorrelationContext {
  return {
    correlationId: paymentIntentId || generateCorrelationId(),
    paymentIntentId,
    tenantId,
  };
}

/**
 * Attach correlation context to logger
 * Returns a logger wrapper with context attached
 */
export function withCorrelation(
  context: CorrelationContext,
  baseLogger: typeof console,
): typeof console {
  const contextData = {
    correlationId: context.correlationId,
    ...(context.paymentIntentId && { paymentIntentId: context.paymentIntentId }),
    ...(context.stripeEventId && { stripeEventId: context.stripeEventId }),
    ...(context.tenantId && { tenantId: context.tenantId }),
  };

  return {
    ...baseLogger,
    log: (...args: unknown[]) => baseLogger.log(...args, contextData),
    info: (...args: unknown[]) => baseLogger.info(...args, contextData),
    warn: (...args: unknown[]) => baseLogger.warn(...args, contextData),
    error: (...args: unknown[]) => baseLogger.error(...args, contextData),
    debug: (...args: unknown[]) => baseLogger.debug(...args, contextData),
  } as typeof console;
}

/**
 * Format correlation context for database storage
 */
export function formatCorrelationMetadata(context: CorrelationContext): Record<string, string> {
  return {
    correlation_id: context.correlationId,
    ...(context.paymentIntentId && { payment_intent_id: context.paymentIntentId }),
    ...(context.stripeEventId && { stripe_event_id: context.stripeEventId }),
    ...(context.checkoutSessionId && { checkout_session_id: context.checkoutSessionId }),
    ...(context.tenantId && { tenant_id: context.tenantId }),
  };
}
