import type Stripe from 'stripe';

/**
 * Collect Stripe webhook signing secrets for the canonical endpoint.
 * Order: primary secret first, then known alternate endpoint secrets.
 */
export function getCanonicalStripeWebhookSecrets(): string[] {
  const candidates = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_BARBER,
    process.env.STRIPE_WEBHOOK_SECRET_BARBER_APPRENTICESHIP,
    process.env.STRIPE_WEBHOOK_SECRET_DONATIONS,
    process.env.STRIPE_WEBHOOK_SECRET_LICENSE,
    process.env.STRIPE_WEBHOOK_SECRET_LICENSES,
    process.env.STRIPE_WEBHOOK_SECRET_STORE,
    process.env.STRIPE_WEBHOOK_SECRET_COSMETOLOGY,
    process.env.STRIPE_TESTING_WEBHOOK_SECRET,
  ];
  const seen = new Set<string>();
  return candidates.filter((s): s is string => {
    if (!s?.trim()) return false;
    const trimmed = s.trim();
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
}

/**
 * Verify a Stripe webhook payload against one of several configured secrets.
 * Used when Dashboard signing secrets and runtime values may be out of sync across endpoints.
 */
export function constructStripeEventWithAnySecret(
  stripe: Stripe,
  body: string,
  signature: string,
  secrets: string[],
): Stripe.Event {
  if (!secrets.length) {
    throw new Error('No webhook signing secrets configured');
  }
  let lastError: unknown = null;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Webhook signature verification failed');
}
