import { describe, expect, it } from 'vitest';
import { assertProviderCanCreateCharges, getBillingProviderConfig } from '@/lib/billing/config';

describe('billing provider configuration', () => {
  it('defaults new billing to QuickBooks', () => {
    expect(getBillingProviderConfig({} as NodeJS.ProcessEnv)).toEqual({ primary: 'quickbooks' });
  });
  it('rejects a retired provider for new charges', () => {
    expect(() => assertProviderCanCreateCharges('stripe' as never, { primary: 'quickbooks' })).toThrow('stripe is not the active billing provider.');
  });
  it('rejects contradictory Stripe settings', () => {
    expect(() => getBillingProviderConfig({ BILLING_PROVIDER: 'stripe' } as NodeJS.ProcessEnv)).toThrow('Invalid billing configuration');
  });
});
