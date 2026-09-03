/**
 * Canonical Stripe webhook route ownership test.
 *
 * Licensing, enrollment, store, donation, subscription, invoice, and refund
 * Stripe events are owned by the LMS /api/webhooks/stripe endpoint. Retired
 * /api/license/webhook and /api/licenses/webhook routes must not return.
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
const canonicalPath = path.join(root, 'apps/lms/app/api/webhooks/stripe/route.ts');
const retiredSingular = path.join(root, 'app/api/license/webhook/route.ts');
const retiredPlural = path.join(root, 'app/api/licenses/webhook/route.ts');

describe('Canonical Stripe webhook ownership', () => {
  it('keeps one canonical LMS webhook endpoint', () => {
    expect(fs.existsSync(canonicalPath)).toBe(true);
    const content = fs.readFileSync(canonicalPath, 'utf-8');

    expect(content).toContain('Canonical Stripe Webhook Handler');
    expect(content).toContain('Path: /api/webhooks/stripe');
    expect(content).toContain('checkout.session.completed');
    expect(content).toContain('kind=license_purchase');
    expect(content).toContain('customer.subscription.updated');
    expect(content).toContain('customer.subscription.deleted');
    expect(content).toContain('invoice.payment_succeeded');
    expect(content).toContain('invoice.payment_failed');
    expect(content).toContain('charge.refunded');
  });

  it('does not retain retired license webhook aliases', () => {
    expect(fs.existsSync(retiredSingular)).toBe(false);
    expect(fs.existsSync(retiredPlural)).toBe(false);
  });
});
