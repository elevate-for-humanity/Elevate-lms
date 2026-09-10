import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
const canonicalPath = path.join(root, 'apps/marketing/app/api/webhooks/stripe/route.ts');
const lmsAdapterPath = path.join(root, 'apps/lms/app/api/webhooks/stripe/route.ts');
const retiredSingular = path.join(root, 'app/api/license/webhook/route.ts');
const retiredPlural = path.join(root, 'app/api/licenses/webhook/route.ts');

describe('Canonical Stripe webhook ownership', () => {
  it('keeps one canonical Marketing writer and a mutation-free LMS adapter', () => {
    const canonical = fs.readFileSync(canonicalPath, 'utf-8');
    const adapter = fs.readFileSync(lmsAdapterPath, 'utf-8');

    for (const event of [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'charge.refunded',
    ])
      expect(canonical).toContain(event);

    expect(adapter).toContain('proxyCanonicalRoute');
    expect(adapter).toContain("'marketing'");
    expect(adapter).not.toMatch(/\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/);
  });

  it('does not retain retired license webhook aliases', () => {
    expect(fs.existsSync(retiredSingular)).toBe(false);
    expect(fs.existsSync(retiredPlural)).toBe(false);
  });
});
