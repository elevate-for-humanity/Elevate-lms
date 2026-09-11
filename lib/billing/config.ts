import type { BillingProvider, BillingProviderMode } from './contracts';

export interface BillingProviderConfig {
  primary: BillingProvider;
  stripe: BillingProviderMode;
}

/** Stripe can remain readable during migration without silently receiving new charges. */
export function getBillingProviderConfig(env: NodeJS.ProcessEnv = process.env): BillingProviderConfig {
  const primary = env.BILLING_PROVIDER === 'stripe' ? 'stripe' : 'quickbooks';
  const stripe = env.STRIPE_BILLING_MODE === 'primary' ? 'primary' : 'archive';
  if (primary === 'stripe' && stripe !== 'primary') {
    throw new Error('Invalid billing configuration: Stripe cannot be primary while STRIPE_BILLING_MODE is archive.');
  }
  return { primary, stripe };
}

export function assertProviderCanCreateCharges(
  provider: BillingProvider,
  config: BillingProviderConfig = getBillingProviderConfig(),
): void {
  if (provider === 'stripe' && config.stripe === 'archive') {
    throw new Error('Stripe is archive-only. New charges must be created through QuickBooks.');
  }
  if (provider !== config.primary) throw new Error(`${provider} is not the active billing provider.`);
}

export async function loadBillingProviderConfig(db: any): Promise<BillingProviderConfig> {
  const { data, error } = await db
    .from('platform_settings')
    .select('key,value')
    .in('key', ['billing_provider', 'stripe_billing_mode']);
  if (error) throw new Error(`Could not load billing settings: ${error.message}`);
  const stored = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  return getBillingProviderConfig({
    ...process.env,
    BILLING_PROVIDER: stored.billing_provider || process.env.BILLING_PROVIDER,
    STRIPE_BILLING_MODE: stored.stripe_billing_mode || process.env.STRIPE_BILLING_MODE,
  });
}
