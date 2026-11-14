import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const { partner } = await requireCurrentHostShopPartner();
    return NextResponse.json({
      completed: partner.onboarding_completed === true && partner.status === 'active',
      step: partner.onboarding_step || 'not_started',
      shopName: partner.name,
      status: partner.status,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json(
      { completed: false, error: 'No active Host Shop context' },
      { status: code === 'HOST_SHOP_UNAUTHENTICATED' ? 401 : 403 },
    );
  }
}

export const GET = withApiAudit('/api/partner/onboarding-status', _GET);
