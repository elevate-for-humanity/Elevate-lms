import { NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';

/**
 * POST /api/subscriptions/create
 * Redirects authenticated users to platform SaaS checkout.
 * Body: { planId: 'solo' | 'business' | 'professional', interval?: 'monthly' | 'annual' }
 */
async function _POST(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const planId = body.planId ?? body.plan;
    if (!planId) {
      return safeError('planId is required', 400);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
    return Response.json(
      {
        ok: true,
        checkoutPath: '/store/plans',
        message: 'Use POST /api/store/platform-checkout for Stripe checkout',
        redirectUrl: `${siteUrl}/store/plans?plan=${encodeURIComponent(String(planId))}`,
      },
      { status: 200 },
    );
  } catch (err) {
    return safeInternalError(err, 'Failed to start subscription');
  }
}

export const POST = withRuntime(_POST);
