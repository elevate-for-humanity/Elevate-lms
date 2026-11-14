import { expect, it } from 'vitest';
import { payoutSetupLabel } from '@/lib/program-holder/payout-summary';
it('shows the saved PayPal account rather than an obsolete QuickBooks setup snapshot', () => {
  expect(payoutSetupLabel({ payout_provider: 'paypal', verification_status: 'pending' })).toBe('PayPal — Pending review');
});
it('distinguishes an active QuickBooks vendor from payment readiness', () => {
  expect(payoutSetupLabel({ payout_provider: 'quickbooks', verification_status: 'vendor_active_payment_pending' })).toBe('QuickBooks — Vendor active; payment pending');
});
it('requires both capabilities before describing an account as verified', () => {
  expect(payoutSetupLabel({ payout_provider: 'paypal', verification_status: 'active', payouts_enabled: true, transfers_enabled: false })).toContain('Verification incomplete');
  expect(payoutSetupLabel({ payout_provider: 'paypal', verification_status: 'active', payouts_enabled: true, transfers_enabled: true })).toContain('Verified account');
  expect(payoutSetupLabel(null)).toBe('Not started');
});
