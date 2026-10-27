import 'server-only';

import { hydrateProcessEnv } from '@/lib/secrets';
import { loadQuickBooksConfig } from '@/lib/integrations/quickbooks-client';

type HolderContext = {
  mode: 'holder';
  user: { id: string; email?: string };
  holderId: string;
  db: any;
};

export type PayoutProvider = 'paypal' | 'quickbooks' | 'branch';

export type PayoutReadiness = {
  provider: PayoutProvider | null;
  accountId: string | null;
  destination: string | null;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  providerConfigured: boolean;
  quickbooksInvitationAvailable: boolean;
  recipientEmail: string | null;
  verificationStatus: 'not_started' | 'banking_required' | 'pending' | 'restricted' | 'active';
};

const masked = (value?: string | null) =>
  value ? value.replace(/^(.{2}).*(@.*|.{2})$/, '$1••••$2') : null;

function secureProviderUrl(value?: string) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}

export async function payoutProviderConfigured(provider: PayoutProvider, db?: any) {
  await hydrateProcessEnv();
  if (provider === 'paypal') {
    return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_ENVIRONMENT === 'production');
  }
  if (provider === 'quickbooks') {
    if (!db || process.env.QB_ENVIRONMENT !== 'production') return false;
    const config = await loadQuickBooksConfig(db);
    return Boolean(config.realmId && config.clientId && config.clientSecret && (config.accessToken || config.refreshToken));
  }
  return Boolean(secureProviderUrl(process.env.BRANCH_ONBOARDING_URL));
}

export async function getProgramHolderPayoutAccount(ctx: HolderContext): Promise<PayoutReadiness> {
  const { data, error } = await ctx.db
    .from('program_holder_payouts')
    .select(
      'payout_provider,provider_recipient_id,paypal_recipient_email,transfers_enabled,payouts_enabled,verification_status',
    )
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (error) throw new Error('Unable to load the payout account.');
  const provider =
    ['paypal','quickbooks','branch'].includes(data?.payout_provider)
      ? data.payout_provider as PayoutProvider
      : null;

  return {
    provider,
    accountId: data?.provider_recipient_id || null,
    destination: masked(data?.provider_recipient_id),
    transfersEnabled: Boolean(data?.transfers_enabled),
    payoutsEnabled: Boolean(data?.payouts_enabled),
    providerConfigured: await payoutProviderConfigured(provider === 'branch' ? 'quickbooks' : provider || 'quickbooks', ctx.db),
    quickbooksInvitationAvailable: Boolean(await payoutProviderUrl('quickbooks', 'onboard', ctx)),
    recipientEmail: data?.paypal_recipient_email || null,
    verificationStatus: data?.verification_status || 'not_started',
  };
}

export async function configureProgramHolderPayoutAccount(
  ctx: HolderContext,
  provider: PayoutProvider = 'quickbooks',
) {
  const { data: existing, error: lookupError } = await ctx.db
    .from('program_holder_payouts')
    .select('user_id,payout_provider,payouts_enabled,transfers_enabled')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (lookupError) throw new Error('Unable to check the payout account.');
  if (existing?.payout_provider === provider) return getProgramHolderPayoutAccount(ctx);
  if (existing?.payouts_enabled || existing?.transfers_enabled) throw new Error('Contact Elevate to change a verified payout provider.');
  const payoutState = {
    payout_provider: provider,
    provider_recipient_id: null,
    paypal_recipient_email: null,
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
        .eq('payouts_enabled', false).eq('transfers_enabled', false)
    : ctx.db.from('program_holder_payouts').insert({
        user_id: ctx.user.id,
        ...payoutState,
      });

  if (existing) {
    if (existing.payout_provider == null) payoutQuery.is('payout_provider', null);
    else payoutQuery.eq('payout_provider', existing.payout_provider);
  }
  const { data: saved, error } = await payoutQuery.select('user_id').maybeSingle();

  if (!error && !saved) throw new Error('Payout account changed during setup. Reload before trying again.');
  if (error) throw new Error('Unable to save the payout account.');

  const { error: holderError } = await ctx.db
    .from('program_holders')
    .update({ payout_status: `${provider}_setup_required` })
    .eq('id', ctx.holderId);

  if (holderError) throw new Error('Payout setup saved, but holder status could not be updated.');
  return getProgramHolderPayoutAccount(ctx);
}

export async function payoutProviderUrl(provider: PayoutProvider, action: 'onboard' | 'dashboard', ctx?: HolderContext) {
  await hydrateProcessEnv();
  if (provider === 'paypal') return secureProviderUrl(process.env.PAYPAL_PAYOUT_SETTINGS_URL || 'https://www.paypal.com/myaccount/money');
  if (provider === 'quickbooks') {
    if (!ctx) return null;
    const { data: account, error } = await ctx.db.from('program_holder_payouts').select('notes').eq('user_id', ctx.user.id).maybeSingle();
    if (error) throw new Error('Unable to load the QuickBooks invitation.');
    return quickBooksInvitationUrl(payoutSetupNotes(account?.notes).quickbooks_invitation_url);
  }
  return secureProviderUrl(action === 'dashboard'
    ? process.env.BRANCH_DASHBOARD_URL || process.env.BRANCH_ONBOARDING_URL
    : process.env.BRANCH_ONBOARDING_URL);
}


/** Invitation tokens belong to one holder; never use a global invitation URL. */
export function quickBooksInvitationUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const safe = secureProviderUrl(value);
  if (!safe) return null;
  const host = new URL(safe).hostname.toLowerCase();
  return ['intuit.com','quickbooks.com'].some(domain => host === domain || host.endsWith('.'+domain)) ? safe : null;
}

export async function saveProgramHolderPayPalRecipient(ctx: HolderContext, email: string) {
  const recipient = email.trim().toLowerCase();
  if (recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Enter a valid PayPal email address.');
  const { data: existing, error: lookupError } = await ctx.db.from('program_holder_payouts')
    .select('user_id,payout_provider,provider_recipient_id,payouts_enabled,transfers_enabled').eq('user_id', ctx.user.id).maybeSingle();
  if (lookupError) throw new Error('Unable to check the payout account.');
  if (existing?.payouts_enabled || existing?.transfers_enabled) {
    if (existing.payout_provider === 'paypal' && existing.provider_recipient_id === recipient) return getProgramHolderPayoutAccount(ctx);
    throw new Error('Contact Elevate to change a verified payout destination.');
  }
  const values = { payout_provider: 'paypal', provider_recipient_id: recipient, paypal_recipient_email: recipient,
    verification_status: 'pending', payouts_enabled: false, transfers_enabled: false,
    updated_at: new Date().toISOString() };
  let query = existing ? ctx.db.from('program_holder_payouts').update(values).eq('user_id', ctx.user.id)
    .eq('payouts_enabled', false).eq('transfers_enabled', false)
    : ctx.db.from('program_holder_payouts').insert({ user_id: ctx.user.id, ...values });
  if (existing) query = existing.payout_provider == null ? query.is('payout_provider', null) : query.eq('payout_provider', existing.payout_provider);
  const { data: saved, error } = await query.select('user_id').maybeSingle();
  if (error || !saved) throw new Error('The payout destination could not be saved. Reload before trying again.');
  return getProgramHolderPayoutAccount(ctx);
}


/** Payout notes are owner-scoped; holder features are readable by other users. */
export function payoutSetupNotes(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value) return {};
  try { const parsed = JSON.parse(value); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed; } catch { /* Preserve existing human notes. */ }
  return { previous_notes: value };
}
