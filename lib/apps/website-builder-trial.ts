import type { SupabaseClient } from '@supabase/supabase-js';
import { syncIndividualAppSubscription } from '@/lib/apps/sync-subscription';

export const WEBSITE_BUILDER_TRIAL = {
  days: 14,
  credits: 500,
  websiteLimit: 1,
  pageLimit: 5,
  publishToElevateSubdomain: true,
  customDomainPurchase: false,
  whiteLabel: false,
  apiAccess: false,
  includedPreviewCapabilities: [
    'PARIS AI Website Builder',
    'PARIS Sales Assistant',
    'ELLIE Customer Support',
    'LIZZY Operations Assistant',
    'ZORA Compliance Assistant',
    'Marketing Assistant',
    'Grant Writer',
    'Grant Discovery',
    'Image & Brand Asset Builder',
    'Commercial / Reel Video Builder',
    'Course Builder / Course Factory',
    'CRM, Forms & Booking',
    'Email, SMS & Automations',
  ],
} as const;

export const WEBSITE_BUILDER_CREDIT_COSTS = {
  initial_site_generation: 60,
  paris_edit: 8,
  assistant_chat: 12,
  marketing_generation: 25,
  image_generation: 40,
  grant_draft: 80,
  course_generation: 150,
  video_generation: 200,
} as const;

export type WebsiteBuilderCreditOperation = keyof typeof WEBSITE_BUILDER_CREDIT_COSTS;

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
): Promise<TrialCreditResult> {
  // Paid access is synchronized with Stripe before every metered AI operation.
  // This prevents a stale local `active` row from granting continued AI use
  // after the upstream subscription has become past_due/canceled.
  const subscription = await syncIndividualAppSubscription(
    userId,
    'website-builder',
    supabase,
  );

  if (!subscription || !['trial', 'active'].includes(subscription.status || '')) {
    return {
      allowed: false,
      charged: 0,
      balance: null,
      isTrial: false,
      upgradeUrl: '/store/apps/website-builder',
      error: 'Website Builder subscription required',
    };
  }

  if (subscription.status === 'active') {
    return { allowed: true, charged: 0, balance: null, isTrial: false };
  }

  if (subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()) {
    return {
      allowed: false,
      charged: 0,
      balance: 0,
      isTrial: true,
      upgradeUrl: '/store/apps/website-builder',
      error: 'Your 14-day Website Builder trial has expired',
    };
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
