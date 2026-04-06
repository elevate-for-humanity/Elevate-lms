// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      customerEmail: session.customer_details?.email || null,
      planName: session.metadata?.plan_name || 'Platform License',
      status: session.payment_status,
      trialEnd: session.subscription
        ? (await stripe.subscriptions.retrieve(session.subscription as string)).trial_end
        : null,
    });
  } catch (error) {
    logger.error('Failed to verify checkout session', error as Error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 404 });
  }
}
export const GET = withApiAudit('/api/store/checkout/verify', _GET);
