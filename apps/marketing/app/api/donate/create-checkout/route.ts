// PUBLIC ROUTE: public donation checkout
// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError } from '@/lib/api/safe-error';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { amount, donor_email, donor_name, checkoutAttemptId } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid donation amount' }, { status: 400 });
    }

    if (!donor_email) return safeError('Email is required for a QuickBooks donation invoice.', 400);
    const response = await fetch(new URL('/api/donate', request.nextUrl.origin), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify({
        amount,
        recurring: false,
        donor_email,
        donor_name,
        checkoutAttemptId,
      }),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/donate/create-checkout', _POST);
