import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST() {
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

  if (!process.env.STRIPE_PRICE_CAREER) {
    return NextResponse.json(
      { error: 'Career pricing not configured' },
      { status: 500 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_CAREER, quantity: 1 }],
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
