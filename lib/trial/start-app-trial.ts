/**
 * Shared server-side helper for starting a 14-day app trial.
 * Used by start-trial server actions across all app pages.
 * Single source of truth — TRIAL_DURATION_DAYS defined once here.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { WEBSITE_BUILDER_TRIAL } from '@/lib/apps/website-builder-trial';

const TRIAL_DURATION_DAYS = 14;

export type StartTrialResult =
  | { status: 'started'; trialEndsAt: string }
  | { status: 'exists' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string };

export async function startAppTrial(
  userId: string,
  appSlug: string,
  authenticatedClient?: SupabaseClient<any>,
): Promise<StartTrialResult> {
  try {
    // Prefer the service-role client when available, but do not make a user's
    // own trial creation depend on privileged secret hydration. RLS explicitly
    // permits authenticated users to read/insert/update their own subscription.
    const admin = await getAdminClient();
    const db = admin ?? authenticatedClient ?? null;

    if (!db) {
      logger.error('[startAppTrial] no Supabase client available', undefined, { appSlug, userId });
      return { status: 'error', message: 'Trial service is temporarily unavailable' };
    }

    const { data: existing, error: existingError } = await db
      .from('user_app_subscriptions')
      .select('id, status, trial_ends_at')
      .eq('user_id', userId)
      .eq('app_slug', appSlug)
      .maybeSingle();

    if (existingError) {
      logger.error('[startAppTrial] lookup failed', undefined, {
        appSlug,
        userId,
        code: existingError.code,
        message: existingError.message,
      });
      return { status: 'error', message: existingError.message };
    }

    if (existing) {
      return { status: 'exists' };
    }

    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { error } = await db.from('user_app_subscriptions').insert({
      user_id: userId,
      app_slug: appSlug,
      plan: 'starter',
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    });

    if (error) {
      logger.error('[startAppTrial] insert failed', undefined, {
        appSlug,
        userId,
        code: error.code,
        message: error.message,
      });
      return { status: 'error', message: error.message };
    }

    if (appSlug === 'website-builder') {
      const { error: walletError } = await db.rpc('ensure_app_trial_wallet', {
        p_user_id: userId,
        p_app_slug: appSlug,
        p_trial_credits: WEBSITE_BUILDER_TRIAL.credits,
      });
      if (walletError) {
        logger.warn('[startAppTrial] Website Builder credit wallet will initialize lazily', {
          appSlug,
          userId,
          message: walletError.message,
        });
      }
    }

    return { status: 'started', trialEndsAt: trialEndsAt.toISOString() };
  } catch (err) {
    logger.error('[startAppTrial] unexpected error', err instanceof Error ? err : undefined, { appSlug, userId });
    return { status: 'error', message: err instanceof Error ? err.message : 'Unexpected error starting trial' };
  }
}
