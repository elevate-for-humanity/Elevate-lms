import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const stripe = getStripe();
  const supabase = await requireAdminClient();

  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Stripe or Supabase not configured' }, { status: 503 });
  }

  try {
    // Verify caller identity — userId must match the authenticated session
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const serverClient = await createServerClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await parseBody<{ userId: string }>(request);
    const { userId } = body;
    // Enforce: caller can only access their own portal
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const resolvedUserId = user.id;

    // userId from body is optional — we use the authenticated user's ID

    // Get Stripe customer ID
    const { data: billing, error: billingError } = await supabase
      .from('customer_billing')
      .select('stripe_customer_id')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    if (billingError || !billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 404 },
      );
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/subscriptions`,
    });

    logger.info(`Created customer portal session for user: ${resolvedUserId}`);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    logger.error(
      'Error creating customer portal session:',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/store/customer-portal', _POST);
