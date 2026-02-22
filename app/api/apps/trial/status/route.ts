import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get('app');

    if (!appSlug) {
      return NextResponse.json({ error: 'App slug required' }, { status: 400 });
    }

    const { data: subscription } = await db
      .from('user_app_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('app_slug', appSlug)
      .single();

    if (!subscription) {
      return NextResponse.json({ 
        hasAccess: false,
        status: 'none',
        message: 'No subscription found'
      });
    }

    // Check trial status
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // Trial expired - update status
        await db
          .from('user_app_subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);

        return NextResponse.json({
          hasAccess: false,
          status: 'expired',
          message: 'Trial expired',
          upgradeUrl: `/store/apps/${appSlug}?upgrade=true`
        });
      }

      return NextResponse.json({
        hasAccess: true,
        status: 'trial',
        daysRemaining,
        trialEndsAt: subscription.trial_ends_at,
        subscription
      });
    }

    // Active paid subscription
    if (subscription.status === 'active') {
      return NextResponse.json({
        hasAccess: true,
        status: 'active',
        plan: subscription.plan,
        subscription
      });
    }

    // Other statuses (canceled, suspended, etc.)
    return NextResponse.json({
      hasAccess: false,
      status: subscription.status,
      message: `Subscription ${subscription.status}`,
      upgradeUrl: `/store/apps/${appSlug}?reactivate=true`
    });

  } catch (error) {
    logger.error('Trial status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
