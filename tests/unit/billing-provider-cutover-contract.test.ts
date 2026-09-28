import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('Canonical billing provider cutover', () => {
  it('presents Admin schedules, PayPal collection, and QuickBooks invoices to learners', () => {
    const layout = read('components/lms/LearnerWorkspaceLayout.tsx');
    expect(layout).toContain('PayPal autopay and QuickBooks invoices are available');
    expect(layout).toContain('Elevate Admin dashboard');
    expect(layout).not.toContain('Affirm and installment');
    expect(layout).not.toContain('Sezzle');
    expect(layout).not.toContain('Afterpay');
  });

  it('keeps the active Admin payment configuration provider-neutral', () => {
    const settings = read('apps/admin/app/settings/payments/page.tsx');
    const diagnostic = read('apps/admin/app/api/admin/payment-config/route.ts');
    const navigation = read('lib/admin/nav-config.ts');
    expect(settings).toContain('PayPal automatic collection + QuickBooks ledger');
    expect(settings).not.toContain('stripe_billing_mode');
    expect(diagnostic).toContain("authority: 'admin_dashboard'");
    expect(diagnostic).toContain("automaticCollection: 'paypal'");
    expect(diagnostic).toContain("invoiceLedger: 'quickbooks'");
    expect(diagnostic).not.toContain("@/lib/stripe");
    expect(navigation).toContain("label: 'Billing Schedules'");
    expect(navigation).toContain("label: 'Payment Settings'");
    expect(navigation).not.toContain('Integrations — Stripe');
  });

  it('does not call Stripe from active license enforcement or system health', () => {
    const licenses = read('apps/admin/app/api/cron/check-licenses/route.ts');
    const health = read('lib/platform/platform-health.ts');
    expect(licenses).toContain('provider_subscription_id');
    expect(licenses).toContain('current_period_end');
    expect(licenses).not.toContain('getStripe');
    expect(licenses).not.toContain("from 'stripe'");
    expect(health).toContain('Billing (QuickBooks + PayPal)');
    expect(health).not.toContain('checkStripe');
    expect(health).not.toContain("import('@/lib/stripe");
  });

  it('keeps the legacy compatibility integrity command executable', () => {
    const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    expect(packageJson.scripts?.['integrity:stripe']).toBe(
      'node scripts/check-stripe-integrity.mjs',
    );
  });
});
