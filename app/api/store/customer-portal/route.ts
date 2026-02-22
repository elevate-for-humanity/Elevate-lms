import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import type { NextRequest } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: 'Stripe or Supabase not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await parseBody<{ userId: string }>(request);
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Get Stripe customer ID
    const { data: billing, error: billingError } = await db
      .from('customer_billing')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (billingError || !billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 404 }
      );
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/subscriptions`,
    });

    logger.info(`Created customer portal session for user: ${userId}`);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    logger.error(
      'Error creating customer portal session:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
