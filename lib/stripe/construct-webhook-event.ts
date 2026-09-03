import type Stripe from 'stripe';

/**
 * Collect Stripe webhook signing secrets used by Elevate endpoints.
 * Each Stripe webhook endpoint has its own signing secret, so shared handlers
 * must be able to verify the endpoint-specific secret as well as legacy ones.
 */
export function getCanonicalStripeWebhookSecrets(): string[] {
  const candidates = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS,
    process.env.STRIPE_WEBHOOK_SECRET_BARBER,
    process.env.STRIPE_WEBHOOK_SECRET_BARBER_APPRENTICESHIP,
    process.env.STRIPE_WEBHOOK_SECRET_DONATIONS,
    process.env.STRIPE_WEBHOOK_SECRET_LICENSE,
    process.env.STRIPE_WEBHOOK_SECRET_LICENSES,
    process.env.STRIPE_WEBHOOK_SECRET_STORE,
    process.env.STRIPE_WEBHOOK_SECRET_COSMETOLOGY,
    process.env.STRIPE_TESTING_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_HOST_SHOP,
    process.env.STRIPE_WEBHOOK_SECRET_APPLICATION_FEE,
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

export function constructStripeEventWithAnySecret(
  stripe: Stripe,
  body: string,
  signature: string,
  secrets: string[],
): Stripe.Event {
  if (!secrets.length) throw new Error('No webhook signing secrets configured');
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

/** Backward-compatible helper for endpoints that share the configured secret pool. */
export function constructWebhookEvent(
  stripe: Stripe,
  body: string,
  signature: string,
): Stripe.Event {
  return constructStripeEventWithAnySecret(stripe, body, signature, getCanonicalStripeWebhookSecrets());
}
