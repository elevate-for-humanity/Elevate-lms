import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const TRIAL_DURATION_DAYS = 14;

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appSlug, plan = 'starter' } = await request.json();

    if (!appSlug) {
      return NextResponse.json({ error: 'App slug required' }, { status: 400 });
    }

    // Check if user already has a subscription for this app
    const { data: existing } = await db
      .from('user_app_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('app_slug', appSlug)
      .single();

    if (existing) {
      // If trial expired, redirect to upgrade
      if (existing.status === 'trial' && existing.trial_ends_at) {
        const trialEnd = new Date(existing.trial_ends_at);
        if (trialEnd < new Date()) {
          return NextResponse.json({ 
            error: 'Trial expired',
            redirect: `/store/apps/${appSlug}?upgrade=true`,
            subscription: existing
          }, { status: 402 });
        }
      }
      
      return NextResponse.json({ 
        message: 'Subscription exists',
        subscription: existing 
      });
    }

    // Create new trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { data: subscription, error } = await db
      .from('user_app_subscriptions')
      .insert({
        user_id: user.id,
        app_slug: appSlug,
        plan: plan,
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndsAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating trial:', error);
      return NextResponse.json({ error: 'Failed to create trial' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Trial started',
      subscription,
      trialEndsAt: trialEndsAt.toISOString(),
      daysRemaining: TRIAL_DURATION_DAYS
    });

  } catch (error) {
    logger.error('Trial start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
