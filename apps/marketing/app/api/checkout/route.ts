import { NextRequest, NextResponse } from 'next/server';
import {
  CheckoutFlowSchema,
  checkoutResponseUrl,
  resolveCheckoutTarget,
} from '@/lib/checkout/unified-checkout';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stable public gateway. Specialized checkout routes retain pricing,
 * authentication, Stripe metadata, pending records, and fulfillment authority.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const parsed = CheckoutFlowSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid checkout request.',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const target = resolveCheckoutTarget(parsed.data);
  const targetUrl = new URL(target.endpoint, request.nextUrl.origin);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        cookie: request.headers.get('cookie') || '',
        'user-agent': request.headers.get('user-agent') || 'Elevate-Checkout-Gateway',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-elevate-checkout-flow': parsed.data.flow,
      },
      body: JSON.stringify(target.payload),
      cache: 'no-store',
    });
    const body = await response
      .json()
      .catch(() => ({ error: 'Checkout service returned an invalid response.' }));
    if (!response.ok) return NextResponse.json(body, { status: response.status });
    return NextResponse.json({
      ...body,
      flow: parsed.data.flow,
      checkoutUrl: checkoutResponseUrl(body),
    });
  } catch (error) {
    logger.error('[checkout/gateway] specialized checkout failed', error, {
      flow: parsed.data.flow,
      endpoint: target.endpoint,
    });
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 502 });
  }
}
