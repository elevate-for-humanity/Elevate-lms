import { NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';

/**
 * POST /api/subscriptions/upgrade
 * Body: { planId, interval? }
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
    return Response.json({
      ok: true,
      message: 'Complete upgrade via platform checkout',
      checkoutApi: '/api/store/platform-checkout',
      plansUrl: `${siteUrl}/store/plans?plan=${encodeURIComponent(String(planId))}`,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to start upgrade');
  }
}

export const POST = withRuntime(_POST);
