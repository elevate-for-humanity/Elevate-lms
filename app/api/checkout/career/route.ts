import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PRICES } from '@/lib/stripe/prices';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data }: any = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const careerPrice = PRICES.CAREER;
  if (!careerPrice) {
    return NextResponse.json(
      { error: 'Career pricing not configured' },
      { status: 500 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: careerPrice, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/lms/(app)/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      subscription_data: {
        metadata: { user_id: user.id },
      },
      customer_email: user.email ?? undefined,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    const error = toError(err);
    return NextResponse.json(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/checkout/career', _POST));
