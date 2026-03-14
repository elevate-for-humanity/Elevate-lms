
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/billing/report-usage/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  const auth = request.headers.get('x-internal-token');
  if (auth !== process.env.INTERNAL_CRON_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: pendingUsage, error } = await supabase
    .from('tenant_usage')
    .select('*, tenant:tenants(*, billing:tenant_billing(*))')
    .eq('reported_to_stripe', false);

  if (error || !pendingUsage) {
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }

  const updates = [];

  for (const u of pendingUsage) {
    const { data: billing } = await supabase
      .from('tenant_billing')
      .select('*')
      .eq('tenant_id', u.tenant_id)
      .single();

    if (!billing?.stripe_subscription_id || !billing.price_id) continue;

    try {
      // Report usage to Stripe subscription item
      const res = await stripe.subscriptionItems.createUsageRecord(
        billing.price_id,
        {
          quantity: u.quantity,
          timestamp: Math.floor(new Date(u.period_end).getTime() / 1000),
          action: 'set',
        }
      );

      updates.push(
        supabase
          .from('tenant_usage')
          .update({
            reported_to_stripe: true,
            stripe_usage_record_id: res.id,
          })
          .eq('id', u.id)
      );
    } catch (err) {
      logger.error('Failed to report usage for tenant', u.tenant_id, err);
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }

  return NextResponse.json({ reported: updates.length });
}
export const POST = withApiAudit('/api/billing/report-usage', _POST);
