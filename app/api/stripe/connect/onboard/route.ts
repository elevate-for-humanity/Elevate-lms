
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/authGuards';

export async function POST(req: Request) {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { accountId } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia',
    });

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        process.env.STRIPE_REFRESH_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/employers/billing/refresh`,
      return_url:
        process.env.STRIPE_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/employers/billing/complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: link.url });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
