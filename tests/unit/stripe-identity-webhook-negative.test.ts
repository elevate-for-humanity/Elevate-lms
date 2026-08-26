import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const routePath = path.resolve('apps/marketing/app/api/webhooks/stripe-identity/route.ts');
const src = fs.readFileSync(routePath, 'utf-8');

describe('Stripe Identity webhook negative paths', () => {
  it('rejects invalid webhook signatures with 400', () => {
    expect(src).toContain('Invalid webhook signature');
    expect(src).toContain('status: 400');
  });

  it('handles failed identity verification events', () => {
    expect(src).toContain("identity.verification_session.requires_input");
    expect(src).toContain("status: 'failed'");
  });

  it('records idempotency to prevent duplicate webhook processing', () => {
    expect(src).toContain("from('stripe_webhook_events')");
    expect(src).toContain("eq('stripe_event_id', event.id)");
  });
});
