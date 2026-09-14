import 'server-only';

import { hydrateProcessEnv } from '@/lib/secrets';

type HolderContext = {
  mode: 'holder';
  user: { id: string; email?: string };
  holderId: string;
  db: any;
};

export type PayoutProvider = 'quickbooks';

export type PayoutReadiness = {
  provider: PayoutProvider | null;
  accountId: string | null;
  destination: string | null;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  providerConfigured: boolean;
  verificationStatus: 'not_started' | 'banking_required' | 'pending' | 'restricted' | 'active';
};

const masked = (value?: string | null) =>
  value ? value.replace(/^(.{2}).*(@.*|.{2})$/, '$1••••$2') : null;

export async function payoutProviderConfigured() {
  await hydrateProcessEnv();
  return Boolean(
    process.env.QUICKBOOKS_CONTRACTOR_ONBOARDING_URL ||
      process.env.QUICKBOOKS_CONTRACTOR_DASHBOARD_URL,
  );
}

export async function getProgramHolderPayoutAccount(
  ctx: HolderContext,
): Promise<PayoutReadiness> {
  const { data } = await ctx.db
    .from('program_holder_payouts')
    .select(
      'payout_provider,provider_recipient_id,transfers_enabled,payouts_enabled,verification_status',
    )
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  const provider = data?.payout_provider === 'quickbooks' ? 'quickbooks' : null;

  return {
    provider,
    accountId: data?.provider_recipient_id || null,
    destination: masked(data?.provider_recipient_id),
    transfersEnabled: Boolean(data?.transfers_enabled),
    payoutsEnabled: Boolean(data?.payouts_enabled),
    providerConfigured: provider ? await payoutProviderConfigured() : false,
    verificationStatus: data?.verification_status || 'not_started',
  };
}

export async function configureProgramHolderPayoutAccount(ctx: HolderContext) {
  const { data: existing } = await ctx.db
    .from('program_holder_payouts')
    .select('user_id')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (!existing) {
    throw new Error('QuickBooks recipient setup must be provisioned by Elevate first.');
  }

  const { error } = await ctx.db
    .from('program_holder_payouts')
    .update({
      payout_provider: 'quickbooks',
      transfers_enabled: false,
      payouts_enabled: false,
      charges_enabled: false,
      instant_payouts_enabled: false,
      verification_status: 'banking_required',
      quickbooks_sync_status: 'recipient_setup_required',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', ctx.user.id);

  if (error) throw new Error('Unable to save the QuickBooks payout account.');

  await ctx.db
    .from('program_holders')
    .update({ payout_status: 'quickbooks_banking_required' })
    .eq('id', ctx.holderId);

  return getProgramHolderPayoutAccount(ctx);
}

export async function payoutProviderUrl(action: 'onboard' | 'dashboard') {
  await hydrateProcessEnv();
  return action === 'dashboard'
    ? process.env.QUICKBOOKS_CONTRACTOR_DASHBOARD_URL ||
        process.env.QUICKBOOKS_CONTRACTOR_ONBOARDING_URL
    : process.env.QUICKBOOKS_CONTRACTOR_ONBOARDING_URL;
}
