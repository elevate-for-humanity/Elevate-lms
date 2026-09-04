import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Program Holder payout contract', () => {
  const route = read('apps/lms/app/api/program-holder/payouts/route.ts');
  const service = read('lib/program-holder/payout-account.ts');
  const panel = read('components/program-holder/PayoutAccessPanel.tsx');
  const migration = read('supabase/migrations/20260903203628_program_holder_stripe_connect_v2.sql');
  const paymentRoute = read('apps/admin/app/api/admin/enrollments/mark-payout-paid/route.ts');
  const releaseService = read('lib/program-holder/release-payment.ts');
  const cronRoute = read('apps/admin/app/api/cron/program-holder-payouts/route.ts');

  it('uses holder-scoped authorization for every payout action', () => {
    expect(route).toContain('requireProgramHolder');
    expect(route).toContain("ctx.mode === 'holder'");
  });

  it('creates Accounts v2 recipient accounts instead of legacy account types', () => {
    expect(service).toContain('stripe.v2.core.accounts.create');
    expect(service).toContain('stripe_transfers: { requested: true }');
    expect(service).not.toMatch(/accounts\.create\(\{\s*type:/);
  });

  it('keeps sensitive payout destination data at Stripe', () => {
    expect(panel).toContain('Elevate never receives or stores the');
    expect(panel).toContain('full debit-card or bank-account number.');
    expect(migration).toContain('Full payout credentials remain at Stripe');
  });

  it('requires both transfer receipt and withdrawals before funds access', () => {
    expect(route).toContain('!ready.transfersEnabled || !ready.payoutsEnabled');
    expect(panel).toContain('status.transfersEnabled && status.payoutsEnabled');
  });

  it('blocks payout setup, funds access, and admin release until onboarding is complete', () => {
    expect(route).toContain('getProgramHolderPaymentReadiness');
    expect(route).toContain('if (!readiness.ready)');
    expect(paymentRoute).toContain('getProgramHolderPaymentReadiness');
    expect(paymentRoute).toContain('getStudentPaymentReadiness');
  });

  it('releases money through Stripe before recording paid state', () => {
    expect(releaseService).toContain('stripe.transfers.create');
    expect(releaseService.indexOf('stripe.transfers.create')).toBeLessThan(
      releaseService.indexOf("increment_1_status: 'paid'"),
    );
    expect(releaseService).toContain('idempotencyKey');
  });

  it('automatically processes only admin-approved due schedules', () => {
    expect(cronRoute).toContain(".eq('increment_1_status', 'approved')");
    expect(cronRoute).toContain(".lte('increment_1_release_date', today)");
  });

  it('does not call a missing QuickBooks endpoint', () => {
    expect(paymentRoute).not.toContain('/api/quickbooks/contractor-payment');
    expect(releaseService).toContain('recordContractorPaymentInQuickBooks');
  });

  it('removes authenticated-wide payout reads', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS auth_read_program_holder_payouts');
    expect(migration).toContain('(SELECT auth.uid()) = user_id');
  });
});
