import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('apprentice self-service portal contracts', () => {
  it('sends the handbook action accepted by the API', () => {
    const client = source('apps/lms/app/apprentice/handbook/AcknowledgeHandbookButton.tsx');
    expect(client).toContain("action: 'acknowledge'");
    expect(client).toContain("handbookVersion: '2026.2'");
  });

  it('reads protected document configuration through the authenticated server route', () => {
    const route = source('apps/lms/app/api/apprentice/documents/route.ts');
    expect(route).toMatch(/db\s*\.from\('apprentice_document_types'\)/);
    expect(route).toContain('resolveEnrollment(db, user.id, programSlug)');
    expect(route).toMatch(/db\.storage\s*\.from\('documents'\)\s*\.upload/);
    expect(route).toContain('document_type: documentType');
    expect(route).toContain('file_size: file.size');
  });

  it('allows configured document type keys without a drifting database allowlist', () => {
    const migration = source(
      'supabase/migrations/20260903143657_allow_dynamic_document_type_keys.sql',
    );
    expect(migration).toContain('DROP CONSTRAINT IF EXISTS documents_document_type_check');
    expect(migration).toContain("document_type ~ '^[a-z][a-z0-9_-]{0,127}$'");
    expect(migration).not.toContain('document_type IN (');
  });

  it('retires Stripe setup while keeping the authenticated legacy portal lookup fail-safe', () => {
    const setup = source('apps/lms/app/api/billing/setup/route.ts');
    const portal = source('apps/lms/app/api/billing/portal/route.ts');
    expect(setup).toContain('retiredStripeCheckout');
    expect(setup).toContain('PayPal automatic billing and QuickBooks accounting');
    expect(portal).toContain('.or(`user_id.eq.${user.id},student_id.eq.${user.id}`)');
  });

  it('collects automatically through PayPal and mirrors completed payments to QuickBooks', () => {
    const paypal = source('lib/billing/providers/paypal-subscriptions.ts');
    const sync = source('lib/billing/paypal-payment-sync.ts');
    const webhook = source('apps/marketing/app/api/webhooks/paypal-billing/route.ts');
    expect(paypal).toContain("interval_unit: 'WEEK'");
    expect(paypal).toContain("user_action: 'SUBSCRIBE_NOW'");
    expect(sync).toContain('createQuickBooksBillingProvider(db).createManualInvoice');
    expect(sync).toContain('recordQuickBooksExternalPayment');
    expect(webhook).toContain("event.event_type === 'PAYMENT.SALE.COMPLETED'");
  });

  it('uses PayPal rather than legacy Stripe state on active apprentice billing screens', () => {
    const billingPage = source('apps/lms/app/apprentice/billing/page.tsx');
    const billingCard = source('components/learner/BillingCard.tsx');
    const apprenticeDashboard = source('apps/lms/app/apprentice/page.tsx');
    expect(billingPage).toContain(".from('billing_schedules')");
    expect(billingPage).toContain('provider_subscription_id');
    expect(billingCard).toContain('Complete PayPal Authorization');
    expect(apprenticeDashboard).toContain('approve PayPal billing');
    expect(billingCard).not.toContain('Stripe');
    expect(apprenticeDashboard).not.toContain('stripe_subscription_id');
  });
});
