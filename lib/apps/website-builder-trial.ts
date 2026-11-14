import type { SupabaseClient } from '@supabase/supabase-js';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

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
