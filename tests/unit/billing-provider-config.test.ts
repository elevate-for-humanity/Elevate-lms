import { describe, expect, it } from 'vitest';
import { assertProviderCanCreateCharges, getBillingProviderConfig } from '@/lib/billing/config';

describe('billing provider configuration', () => {
  it('defaults new billing to QuickBooks without enabling a retired provider', () => {
    expect(getBillingProviderConfig({} as NodeJS.ProcessEnv)).toEqual({ primary: 'quickbooks' });
  });
  it('blocks new Stripe charges even when a legacy caller requests them', () => {
    expect(() => Reflect.apply(assertProviderCanCreateCharges, null, ['stripe', { primary: 'quickbooks' }])).toThrow('not the active billing provider');
  });
  it('rejects contradictory Stripe settings', () => {
    expect(() => getBillingProviderConfig({ BILLING_PROVIDER: 'stripe' } as NodeJS.ProcessEnv)).toThrow('Invalid billing configuration');
  });
});
