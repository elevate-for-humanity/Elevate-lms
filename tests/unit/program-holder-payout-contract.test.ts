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
    expect(paymentRoute).toContain('Payment is on hold until Program Holder onboarding is complete.');
  });

  it('removes authenticated-wide payout reads', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS auth_read_program_holder_payouts');
    expect(migration).toContain('(SELECT auth.uid()) = user_id');
  });
});
