import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('apprentice automatic-payment contract', () => {
  const migration = read('supabase/migrations/20260922111420_paypal_apprentice_autopay.sql');
  const reconciliation = read('apps/admin/app/api/cron/reconcile-apprentice-payments/route.ts');
  const invoiceFallback = read('apps/admin/app/api/cron/generate-apprentice-invoices/route.ts');
  const scheduler = read('.github/workflows/cron-scheduler.yml');
  const legacy83 = read('supabase/migrations/20260922111421_legacy_83_billing_preference.sql');

  it('fails closed until both the recurring release and provider agreement are active', () => {
    expect(migration).toContain('AUTOPAY_PROVIDER_NOT_ACTIVE');
    expect(migration).toContain('AUTOPAY_AUTHORIZATION_NOT_APPROVED');
    expect(migration).toContain("billing_auth.status = 'approved'");
    expect(migration).toContain("new.provider_status <> 'active'");
  });

  it('reconciles PayPal automatic collections into QuickBooks every week', () => {
    expect(reconciliation).toContain('getPayPalSubscription');
    expect(reconciliation).toContain('listPayPalSubscriptionTransactions');
    expect(reconciliation).toContain('syncPayPalPaymentToQuickBooks');
    expect(scheduler).toContain('reconcile-apprentice-payments');
    expect(scheduler).toContain('POST "$ADMIN_URL/api/cron/reconcile-apprentice-payments"');
  });

  it('runs reconcile before the fallback in the Monday job so a collected week never gets a second invoice', () => {
    expect(
      scheduler.indexOf('POST "$ADMIN_URL/api/cron/reconcile-apprentice-payments"'),
    ).toBeLessThan(
      scheduler.indexOf('POST "$ADMIN_URL/api/cron/generate-apprentice-invoices"'),
    );
  });

  it('makes the fallback consult the duplicate detector and PayPal before creating an invoice', () => {
    expect(invoiceFallback).toContain('findInvoiceForScheduleWeek');
    expect(invoiceFallback).toContain('hasCompletedPayPalPaymentForWeek');
    expect(invoiceFallback).toContain("skipped: 'duplicate-invoice'");
    expect(invoiceFallback).toContain("skipped: 'paypal-payment-found'");
  });

  it('makes reconcile apply payments to the week’s existing invoice instead of creating a second one', () => {
    expect(reconciliation).toContain('appliedToExisting');
    expect(reconciliation).toContain('duplicatesSkipped');
  });

  it('falls back to an emailed QuickBooks invoice while PayPal activation is pending', () => {
    expect(invoiceFallback).toContain(".eq('status', 'paused')");
    expect(invoiceFallback).toContain('createManualInvoice');
    expect(invoiceFallback).toContain('sendEmail');
    expect(scheduler).toContain('generate-apprentice-invoices');
  });

  it('keeps Legacy 83 monthly on the 15th and outside apprentice tuition', () => {
    expect(legacy83).toContain("lower('Legacy 83 Business Inc.')");
    expect(legacy83).toContain("'monthly'");
    expect(legacy83).toContain('\n  15,');
    expect(legacy83).toContain('is_apprentice_tuition');
    expect(legacy83).toContain('Keep separate from weekly apprentice tuition collection.');
  });
});
