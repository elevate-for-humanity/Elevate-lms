import 'server-only';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getStripe, stripeCall } from '@/lib/stripe/client';

type HolderContext = { mode: 'holder'; user: { id: string; email?: string }; holderId: string; db: any };
export type PayoutReadiness = { accountId: string | null; transfersEnabled: boolean; payoutsEnabled: boolean; verificationStatus: 'not_started' | 'pending' | 'restricted' | 'active' };

function status(account: any, capability: 'stripe_transfers' | 'payouts') {
  return account.configuration?.recipient?.capabilities?.stripe_balance?.[capability]?.status;
}

export async function syncProgramHolderPayoutAccount(ctx: HolderContext, accountId: string): Promise<PayoutReadiness> {
  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe payout processing is not configured.');
  const account = await stripeCall(() => stripe.v2.core.accounts.retrieve(accountId));
  const transfersEnabled = status(account, 'stripe_transfers') === 'active';
  const payoutsEnabled = status(account, 'payouts') === 'active';
  const restricted = status(account, 'stripe_transfers') === 'restricted' || status(account, 'payouts') === 'restricted';
  const verificationStatus = transfersEnabled && payoutsEnabled ? 'active' : restricted ? 'restricted' : 'pending';
  const { error } = await ctx.db.from('program_holder_payouts').update({ transfers_enabled: transfersEnabled, payouts_enabled: payoutsEnabled, charges_enabled: transfersEnabled, verification_status: verificationStatus, last_stripe_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', ctx.user.id).eq('stripe_account_id', accountId);
  if (error) throw new Error('Unable to synchronize payout readiness.');
  await ctx.db.from('program_holders').update({ payout_status: verificationStatus === 'active' ? 'active' : 'pending' }).eq('id', ctx.holderId);
  return { accountId, transfersEnabled, payoutsEnabled, verificationStatus };
}

export async function ensureProgramHolderPayoutAccount(ctx: HolderContext) {
  const { data: existing } = await ctx.db.from('program_holder_payouts').select('stripe_account_id').eq('user_id', ctx.user.id).maybeSingle();
  if (existing?.stripe_account_id) return existing.stripe_account_id as string;
  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe payout processing is not configured.');
  const { data: holder } = await ctx.db.from('program_holders').select('name,organization_name').eq('id', ctx.holderId).maybeSingle();
  const account = await stripeCall(() => stripe.v2.core.accounts.create({
    contact_email: ctx.user.email,
    display_name: holder?.organization_name || holder?.name || 'Program Holder',
    dashboard: 'express',
    defaults: { currency: 'usd', responsibilities: { fees_collector: 'application', losses_collector: 'application' } },
    configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
    metadata: { program_holder_id: ctx.holderId, user_id: ctx.user.id, integration: 'elevate_program_holder_payouts_v2' },
  }));
  const { error } = await ctx.db.from('program_holder_payouts').insert({ user_id: ctx.user.id, stripe_account_id: account.id, stripe_account_type: 'recipient_v2_express', payouts_enabled: false, charges_enabled: false, transfers_enabled: false, verification_status: 'pending', quickbooks_sync_status: 'not_ready' });
  if (error) throw new Error('Unable to save the payout account.');
  await ctx.db.from('program_holders').update({ payout_status: 'pending' }).eq('id', ctx.holderId);
  return account.id;
}

