

import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { accountId } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = getStripe();

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/stripe/connect/onboard', _POST));
