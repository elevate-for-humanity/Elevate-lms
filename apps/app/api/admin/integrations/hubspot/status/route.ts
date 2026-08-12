import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getHubSpotFreeCrmStatus } from '@/lib/integrations/hubspot/free-crm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only HubSpot configuration status.
 * Never returns credentials or token fragments.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const status = getHubSpotFreeCrmStatus();

  return NextResponse.json({
    ok: true,
    integration: 'hubspot',
    ...status,
    paidFeaturesEnabled: false,
    secretExposed: false,
  });
}
