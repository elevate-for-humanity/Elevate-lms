// PUBLIC ROUTE: O*NET labor market data — no PII, rate-limited, API key stays server-side
/**
 * GET /api/onet?soc=49-9021.00
 * Proxies O*NET Web Services. Returns a cached OnetLaborSnapshot for the given SOC code.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOnetSnapshot } from '@/lib/onet/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;

  const soc = request.nextUrl.searchParams.get('soc');
  if (!soc || !/^\d{2}-\d{4}\.\d{2}$/.test(soc)) {
    return NextResponse.json({ error: 'Invalid SOC code' }, { status: 400 });
  }

  const snapshot = await getOnetSnapshot(soc);
  if (!snapshot) {
    return NextResponse.json({ error: 'O*NET data unavailable' }, { status: 503 });
  }

  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}
