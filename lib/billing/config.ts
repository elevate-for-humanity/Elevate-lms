import type { BillingProvider } from './contracts';

export interface BillingProviderConfig {
  primary: BillingProvider;
}

/** Active billing is provider-neutral and no longer permits Stripe. */
export function getBillingProviderConfig(env: NodeJS.ProcessEnv = process.env): BillingProviderConfig {
  const requested = String(env.BILLING_PROVIDER || 'quickbooks').toLowerCase();
  if (requested === 'stripe') {
    throw new Error('Invalid billing configuration: Stripe is retired. Use QuickBooks or PayPal.');
  }
  const primary: BillingProvider = requested === 'paypal' ? 'paypal' : 'quickbooks';
  return { primary };
}

export function assertProviderCanCreateCharges(
  provider: BillingProvider,
  config: BillingProviderConfig = getBillingProviderConfig(),
): void {
  if (provider !== config.primary) throw new Error(`${provider} is not the active billing provider.`);
}

export async function loadBillingProviderConfig(db: any): Promise<BillingProviderConfig> {
  const { data, error } = await db
    .from('platform_settings')
    .select('key,value')
    .eq('key', 'billing_provider');
  if (error) throw new Error(`Could not load billing settings: ${error.message}`);
  const stored = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  return getBillingProviderConfig({
    ...process.env,
    BILLING_PROVIDER: stored.billing_provider || process.env.BILLING_PROVIDER,
  });
}
