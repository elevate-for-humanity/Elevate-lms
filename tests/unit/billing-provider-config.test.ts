import { describe, expect, it } from 'vitest';
import { assertProviderCanCreateCharges, getBillingProviderConfig } from '@/lib/billing/config';

describe('billing provider configuration', () => {
  it('defaults new billing to QuickBooks and Stripe to archive-only', () => {
    expect(getBillingProviderConfig({} as NodeJS.ProcessEnv)).toEqual({ primary: 'quickbooks', stripe: 'archive' });
  });
  it('blocks new Stripe charges in archive mode', () => {
    expect(() => assertProviderCanCreateCharges('stripe', { primary: 'quickbooks', stripe: 'archive' })).toThrow('Stripe is archive-only');
  });
  it('rejects contradictory Stripe settings', () => {
    expect(() => getBillingProviderConfig({ BILLING_PROVIDER: 'stripe' } as NodeJS.ProcessEnv)).toThrow('Invalid billing configuration');
  });
});
