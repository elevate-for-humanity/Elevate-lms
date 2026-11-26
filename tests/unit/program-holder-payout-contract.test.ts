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

  it('supports personal QuickBooks contractor setup and optional PayPal', () => {
    expect(service).toContain("export type PayoutProvider = 'paypal' | 'quickbooks' | 'branch'");
    expect(service).toContain('quickBooksInvitationUrl');
    expect(service).toContain("select('notes').eq('user_id', ctx.user.id)");
    expect(service).not.toContain('QUICKBOOKS_CONTRACTOR_ONBOARDING_URL');
  });

  it('keeps sensitive payout destination data at the selected provider', () => {
    expect(panel).toContain('Elevate does not store bank account, routing, or debit-card numbers.');
    expect(panel).not.toContain('name="routing_number"');
    expect(migration).toContain('never a raw bank or card number');
  });

  it('separates verified setup from compliance-gated payment release', () => {
    expect(panel).toContain('status?.transfersEnabled');
    expect(panel).toContain('status?.payoutsEnabled');
    expect(panel).toContain("status?.verificationStatus === 'active'");
    expect(panel).toContain('!status.onboardingReady');
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

describe('Payout void action', () => {
  const voidRoute = read('apps/admin/app/api/admin/enrollments/void-payout/route.ts');
  const migration = read(
    'supabase/migrations/20261124130000_allow_voided_payout_status.sql',
  );
  const queuePage = read('apps/admin/app/payout-queue/page.tsx');
  const queueApiRoute = read('apps/admin/app/api/admin/enrollments/payout-queue/route.ts');
  const voidButton = read('apps/admin/app/payout-queue/VoidPayoutButton.tsx');
  const paymentRoute = read('apps/admin/app/api/admin/enrollments/mark-payout-paid/route.ts');

  it('is admin-only and requires a reason', () => {
    expect(voidRoute).toContain('apiRequireAdmin');
    expect(voidRoute).toContain("['admin']");
    expect(voidRoute).toContain('A reason is required to void a payout');
  });

  it('voids the payout, holds the schedule, and audits the change', () => {
    expect(voidRoute).toContain("payout_status: 'voided'");
    expect(voidRoute).toContain("increment_1_status: 'held'");
    expect(voidRoute).toContain('enrollment_voucher_audit');
    expect(voidRoute).toContain("field_name: 'payout_status'");
    expect(voidRoute).toContain("new_value: 'voided'");
    expect(voidRoute).not.toContain('releaseProgramHolderPayment');
  });

  it('refuses to void payouts that are already paid or voided', () => {
    expect(voidRoute).toContain('already paid and cannot be voided');
    expect(voidRoute).toContain('already voided');
  });

  it('widens the payout_status CHECK so voided can be stored', () => {
    expect(migration).toContain('program_enrollments_payout_status_check');
    expect(migration).toContain("'voided'");
  });

  it('excludes voided rows from the queue page and queue API', () => {
    expect(queuePage).toContain(".neq('payout_status', 'voided')");
    expect(queueApiRoute).toContain(".neq('payout_status', 'voided')");
  });

  it('offers a Void button next to the pay button for unpaid rows', () => {
    expect(queuePage).toContain('VoidPayoutButton');
    expect(voidButton).toContain('/api/admin/enrollments/void-payout');
    expect(voidButton).toContain('reason');
  });

  it('does not change the mark-payout-paid route', () => {
    expect(paymentRoute).not.toContain('voided');
    expect(paymentRoute).not.toContain('void-payout');
  });
});

