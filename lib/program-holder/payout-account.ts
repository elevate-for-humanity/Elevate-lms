import 'server-only';

import { hydrateProcessEnv } from '@/lib/secrets';

type HolderContext = {
  mode: 'holder';
  user: { id: string; email?: string };
  holderId: string;
  db: any;
};

export type PayoutProvider = 'paypal' | 'branch';

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

export async function payoutProviderConfigured(provider: PayoutProvider) {
  await hydrateProcessEnv();
  if (provider === 'paypal') {
    return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  }
  return Boolean(process.env.BRANCH_ONBOARDING_URL);
}

export async function getProgramHolderPayoutAccount(ctx: HolderContext): Promise<PayoutReadiness> {
  const { data } = await ctx.db
    .from('program_holder_payouts')
    .select(
      'payout_provider,provider_recipient_id,transfers_enabled,payouts_enabled,verification_status',
    )
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  const provider =
    data?.payout_provider === 'paypal' || data?.payout_provider === 'branch'
      ? data.payout_provider
      : null;

  return {
    provider,
    accountId: data?.provider_recipient_id || null,
    destination: masked(data?.provider_recipient_id),
    transfersEnabled: Boolean(data?.transfers_enabled),
    payoutsEnabled: Boolean(data?.payouts_enabled),
    providerConfigured: provider ? await payoutProviderConfigured(provider) : false,
    verificationStatus: data?.verification_status || 'not_started',
  };
}

export async function configureProgramHolderPayoutAccount(
  ctx: HolderContext,
  provider: PayoutProvider = 'branch',
) {
  const { data: existing } = await ctx.db
    .from('program_holder_payouts')
    .select('user_id')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  const payoutState = {
    payout_provider: provider,
    transfers_enabled: false,
    payouts_enabled: false,
    charges_enabled: false,
    instant_payouts_enabled: false,
    verification_status: 'banking_required',
    quickbooks_sync_status: 'pending',
    updated_at: new Date().toISOString(),
  };

  const payoutQuery = existing
    ? ctx.db.from('program_holder_payouts').update(payoutState).eq('user_id', ctx.user.id)
    : ctx.db.from('program_holder_payouts').insert({
        user_id: ctx.user.id,
        ...payoutState,
      });

  const { error } = await payoutQuery;

  if (error) throw new Error('Unable to save the payout account.');

  await ctx.db
    .from('program_holders')
    .update({ payout_status: `${provider}_setup_required` })
    .eq('id', ctx.holderId);

  return getProgramHolderPayoutAccount(ctx);
}

export async function payoutProviderUrl(provider: PayoutProvider, action: 'onboard' | 'dashboard') {
  await hydrateProcessEnv();
  if (provider === 'paypal') return process.env.PAYPAL_PAYOUT_SETTINGS_URL || null;
  return action === 'dashboard'
    ? process.env.BRANCH_DASHBOARD_URL || process.env.BRANCH_ONBOARDING_URL
    : process.env.BRANCH_ONBOARDING_URL;
}
