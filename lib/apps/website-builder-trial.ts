import type { SupabaseClient } from '@supabase/supabase-js';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

import {
  WEBSITE_BUILDER_CREDIT_COSTS,
  WEBSITE_BUILDER_TRIAL,
  type WebsiteBuilderCreditOperation,
} from '@/lib/apps/website-builder-credit-policy';

export { WEBSITE_BUILDER_CREDIT_COSTS, WEBSITE_BUILDER_TRIAL };
export type { WebsiteBuilderCreditOperation };

export type TrialCreditResult = {
  allowed: boolean;
  charged: number;
  balance: number | null;
  isTrial: boolean;
  upgradeUrl?: string;
  error?: string;
};

export async function consumeWebsiteBuilderCredits(
  supabase: SupabaseClient<any>,
  userId: string,
  operation: WebsiteBuilderCreditOperation,
  options: { deferDebitUntilCommit?: boolean } = {},
): Promise<TrialCreditResult> {
  // Use the same canonical access decision as the builder pages and APIs.
  // This preserves Stripe-synchronized customer enforcement while allowing
  // platform administrators to operate and verify the product without a
  // redundant personal subscription.
  const access = await getWebsiteBuilderAccess(userId, supabase);

  if (!access.allowed) {
    return {
      allowed: false,
      charged: 0,
      balance: null,
      isTrial: false,
      upgradeUrl: access.upgradeUrl || '/store/apps/website-builder',
      error: access.reason === 'trial_expired'
        ? 'Your 14-day Website Builder trial has expired'
        : 'Website Builder subscription required',
    };
  }

  if (access.isAdmin || access.status === 'active') {
    return { allowed: true, charged: 0, balance: null, isTrial: false };
  }

  const { data: ensured, error: ensureError } = await supabase.rpc('ensure_app_trial_wallet', {
    p_user_id: userId,
    p_app_slug: 'website-builder',
    p_trial_credits: WEBSITE_BUILDER_TRIAL.credits,
  });

  if (ensureError) {
    return {
      allowed: false,
      charged: 0,
      balance: null,
      isTrial: true,
      error: ensureError.message,
    };
  }

  const cost = WEBSITE_BUILDER_CREDIT_COSTS[operation];
  // Generation and PARIS commit the debit and website write in one DB transaction. This is
  // only an access/balance preflight; it never authorizes an uncharged write.
  if (options.deferDebitUntilCommit) {
    if (operation !== 'paris_edit' && operation !== 'initial_site_generation') throw new Error('Deferred debit is only supported for atomic website commits');
    const balance = typeof ensured === 'number' ? ensured : null;
    const allowed = balance !== null && balance >= cost;
    return { allowed, charged: 0, balance, isTrial: true,
      error: allowed ? undefined : 'Trial credits are used up. Upgrade or add credits to keep building.',
      upgradeUrl: allowed ? undefined : '/store/apps/website-builder' };
  }

  const { data: consumed, error: consumeError } = await supabase.rpc('consume_app_credits', {
    p_user_id: userId,
    p_app_slug: 'website-builder',
    p_operation: operation,
    p_cost: cost,
  });

  if (consumeError) {
    return {
      allowed: false,
      charged: 0,
      balance: typeof ensured === 'number' ? ensured : null,
      isTrial: true,
      error: consumeError.message,
    };
  }

  const row = Array.isArray(consumed) ? consumed[0] : consumed;
  const allowed = Boolean(row?.success);
  const balance = typeof row?.balance === 'number' ? row.balance : Number(row?.balance ?? 0);

  return {
    allowed,
    charged: allowed ? cost : 0,
    balance,
    isTrial: true,
    upgradeUrl: allowed ? undefined : '/store/apps/website-builder',
    error: allowed ? undefined : 'Trial credits are used up. Upgrade or add credits to keep building.',
  };
}
