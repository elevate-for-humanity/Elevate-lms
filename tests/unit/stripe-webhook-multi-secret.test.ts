import { describe, expect, it } from 'vitest';
import Stripe from 'stripe';
import {
  constructStripeEventWithAnySecret,
  getCanonicalStripeWebhookSecrets,
} from '@/lib/stripe/construct-webhook-event';

describe('constructStripeEventWithAnySecret', () => {
  const stripe = new Stripe('sk_test_dummy', { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion });
  const primary = 'whsec_test_primary';
  const secondary = 'whsec_test_secondary';

  it('verifies when the second secret matches', () => {
    const payload = JSON.stringify({ id: 'evt_test', object: 'event', type: 'ping' });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: secondary,
    });
    const event = constructStripeEventWithAnySecret(stripe, payload, header, [primary, secondary]);
    expect(event.id).toBe('evt_test');
  });

  it('deduplicates secrets in getCanonicalStripeWebhookSecrets', () => {
    const prev = process.env.STRIPE_WEBHOOK_SECRET;
    const prevBarber = process.env.STRIPE_WEBHOOK_SECRET_BARBER;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_same';
    process.env.STRIPE_WEBHOOK_SECRET_BARBER = 'whsec_same';
    const secrets = getCanonicalStripeWebhookSecrets();
    expect(secrets.filter((s) => s === 'whsec_same').length).toBe(1);
    if (prev === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = prev;
    if (prevBarber === undefined) delete process.env.STRIPE_WEBHOOK_SECRET_BARBER;
    else process.env.STRIPE_WEBHOOK_SECRET_BARBER = prevBarber;
  });
});
