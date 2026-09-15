import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Program Holder payout contract', () => {
  const route = read('apps/lms/app/api/program-holder/payouts/route.ts');
  const service = read('lib/program-holder/payout-account.ts');
  const panel = read('components/program-holder/PayoutAccessPanel.tsx');
  const migration = read(
    'supabase/migrations/20260912042534_provider_neutral_contractor_payouts.sql',
  );
  const paymentRoute = read('apps/admin/app/api/admin/enrollments/mark-payout-paid/route.ts');
  const releaseService = read('lib/program-holder/release-payment.ts');
  const cronRoute = read('apps/admin/app/api/cron/program-holder-payouts/route.ts');

  it('uses holder-scoped authorization for every payout action', () => {
    expect(route).toContain('requireProgramHolder');
    expect(route).toContain("ctx.mode === 'holder'");
  });

  it('supports secure ACH and optional PayPal without treating QuickBooks as a processor', () => {
    expect(service).toContain("export type PayoutProvider = 'paypal' | 'branch'");
    expect(service).toContain('BRANCH_ONBOARDING_URL');
    expect(service).not.toContain('QUICKBOOKS_CONTRACTOR_ONBOARDING_URL');
  });

  it('keeps sensitive payout destination data at the selected provider', () => {
    expect(panel).toContain('Elevate never receives or');
    expect(panel).toContain('stores the full account or debit-card number.');
    expect(migration).toContain('never a raw bank or card number');
  });

  it('requires transfer and payout readiness before funds access', () => {
    expect(panel).toContain('status.transfersEnabled');
    expect(panel).toContain('status.payoutsEnabled');
    expect(panel).toContain('status.providerConfigured');
  });

  it('blocks release until holder and student requirements are complete', () => {
    expect(route).toContain('getProgramHolderPaymentReadiness');
    expect(paymentRoute).toContain('getProgramHolderPaymentReadiness');
    expect(paymentRoute).toContain('getStudentPaymentReadiness');
  });

  it('waits for provider confirmation before recording paid state', () => {
    expect(releaseService).toContain('createPayPalPayout');
    expect(releaseService).toContain("status:'processing'");
    expect(releaseService).not.toContain("increment_1_status: 'paid'");
  });

  it('automatically processes only admin-approved due schedules', () => {
    expect(cronRoute).toContain(".eq('increment_1_status', 'approved')");
    expect(cronRoute).toContain(".lte('increment_1_release_date', today)");
  });

  it('records provider-confirmed payments in QuickBooks without a missing endpoint', () => {
    expect(paymentRoute).not.toContain('/api/quickbooks/contractor-payment');
    expect(paymentRoute).toContain('releaseProgramHolderPayment');
  });

  it('uses opaque recipient and transfer references', () => {
    expect(migration).toContain('provider_recipient_id');
    expect(migration).toContain('program_holder_payout_transactions_provider_transfer_key');
  });
});
