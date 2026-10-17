import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminClient } from '@/lib/supabase/admin';
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
  quantity = 1,
): Promise<TrialCreditResult> {
  // Entitlement and funded usage are separate checks. Paid accounts also consume credits.
  const access = await getWebsiteBuilderAccess(userId, supabase);

  if (!access.allowed) {
    return {
      allowed: false,
      charged: 0,
      balance: null,
      isTrial: false,
      upgradeUrl: access.upgradeUrl || '/store/apps/website-builder',
      error:
        access.reason === 'trial_expired'
          ? 'Your 14-day Website Builder trial has expired'
          : 'Website Builder subscription required',
    };
  }

  if (access.isAdmin) {
    return { allowed: true, charged: 0, balance: null, isTrial: false };
  }

  const isTrial = access.status === 'trial';
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 3 ||
    (quantity !== 1 && operation !== 'initial_site_generation') ||
    !Object.hasOwn(WEBSITE_BUILDER_CREDIT_COSTS, operation)
  ) {
    return { allowed: false, charged: 0, balance: null, isTrial, error: 'Invalid usage request' };
  }
  // Credit mutation is service-only; never let a browser choose its own allowance or cost.
  let db;
  try {
    db = await requireAdminClient();
  } catch {
    return {
      allowed: false,
      charged: 0,
      balance: null,
      isTrial,
      error: 'Usage service is temporarily unavailable',
    };
  }
  if (isTrial) {
    const { error } = await db.rpc('ensure_app_trial_wallet', {
      p_user_id: userId,
      p_app_slug: 'website-builder',
      p_trial_credits: WEBSITE_BUILDER_TRIAL.credits,
    });
    if (error)
      return {
        allowed: false,
        charged: 0,
        balance: null,
        isTrial,
        error: 'Usage service is temporarily unavailable',
      };
  }
  const cost = WEBSITE_BUILDER_CREDIT_COSTS[operation] * quantity;
  const { data: consumed, error: consumeError } = await db.rpc(
    'consume_website_builder_credits_v1',
    {
      p_user_id: userId,
      p_operation: operation,
      p_quantity: quantity,
    },
  );
  if (consumeError)
    return {
      allowed: false,
      charged: 0,
      balance: null,
      isTrial,
      error: 'Usage service is temporarily unavailable',
    };

  const row = Array.isArray(consumed) ? consumed[0] : consumed;
  const allowed = Boolean(row?.success);
  const balance = typeof row?.balance === 'number' ? row.balance : Number(row?.balance ?? 0);

  return {
    allowed,
    charged: allowed ? cost : 0,
    balance,
    isTrial,
    upgradeUrl: allowed ? undefined : '/store/apps/website-builder',
    error: allowed
      ? undefined
      : 'Your included credits are used up. Renew or upgrade to keep generating.',
  };
}
