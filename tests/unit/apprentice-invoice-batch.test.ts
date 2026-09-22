import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  apprenticeInvoiceEmail,
  apprenticeInvoiceIdempotencyKey,
  billingWeekStart,
  nextWeeklyInvoiceDateAfter,
} from '@/lib/billing/apprentice-invoice-batch';

const source = (path: string) => readFileSync(path, 'utf8');

describe('apprentice invoice fallback batch', () => {
  it('uses one deterministic invoice key per schedule and billing week', () => {
    const runAt = new Date('2026-09-22T12:00:00.000Z');
    expect(billingWeekStart(runAt)).toBe('2026-09-21');
    expect(apprenticeInvoiceIdempotencyKey('schedule-1', runAt)).toBe(
      'apprentice-fallback:schedule-1:2026-09-21',
    );
  });

  it('advances a stale schedule beyond the current processing date', () => {
    expect(nextWeeklyInvoiceDateAfter('2026-09-14', '2026-09-22')).toBe('2026-09-28');
  });

  it('emails every open invoice, its Pay Now link, and the access warning', () => {
    const email = apprenticeInvoiceEmail({
      customerName: 'Learner & Family',
      productName: 'Apprenticeship Tuition',
      invoiceNumber: 'INV-2',
      amountCents: 7500,
      dueDate: '2026-09-22',
      paymentUrl: 'https://pay.example/current',
      openInvoices: [
        {
          id: '1',
          invoiceNumber: 'INV-1',
          amountCents: 7500,
          status: 'open',
          dueDate: '2026-09-14',
          paymentUrl: 'https://pay.example/old',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2',
          amountCents: 7500,
          status: 'open',
          dueDate: '2026-09-22',
          paymentUrl: 'https://pay.example/current',
        },
      ],
    });
    expect(email.html).toContain('INV-1');
    expect(email.html).toContain('https://pay.example/old');
    expect(email.html).toContain('INV-2');
    expect(email.html).toContain('https://pay.example/current');
    expect(email.html).toContain('Account access warning');
    expect(email.text).toContain('will not be able to sign in again');
    expect(email.html).toContain('Learner &amp; Family');
  });

  it('wires weekly generation, dashboard Pay Now links, and login enforcement', () => {
    const cron = source('apps/admin/app/api/cron/generate-apprentice-invoices/route.ts');
    const workflow = source('.github/workflows/cron-scheduler.yml');
    const dashboard = source('apps/lms/app/apprentice/billing/page.tsx');
    const signIn = source('apps/lms/app/api/auth/signin/route.ts');
    expect(cron).toContain('createManualInvoice');
    expect(cron).toContain('sendEmail');
    expect(cron).toContain('db.auth.admin.signOut(userId)');
    expect(workflow).toContain('/api/cron/generate-apprentice-invoices');
    expect(dashboard).toContain('Pay now');
    expect(dashboard).toContain('Account access warning');
    expect(signIn).toContain('BILLING_PAST_DUE');
  });

  it('uses an expiring database exemption instead of hardcoding a learner bypass', () => {
    const helper = source('lib/billing/apprentice-invoice-batch.ts');
    const migration = source('supabase/migrations/20260922194500_billing_access_exemptions.sql');
    expect(helper).toContain(".from('billing_access_exemptions')");
    expect(helper).toContain('!exemption.data?.expires_at');
    expect(migration).toContain('2026-10-05 00:00:00-04');
    expect(migration).toContain('Invoices remain due and visible.');
  });
});
