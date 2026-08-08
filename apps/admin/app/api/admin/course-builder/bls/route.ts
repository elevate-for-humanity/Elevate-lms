/** BLS occupational data for the Unified Course Builder. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

const BLS_API_BASE = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const action = request.nextUrl.searchParams.get('action') || 'occupations';
  const occupation = request.nextUrl.searchParams.get('occupation') || '29-1141';
  try {
    if (action === 'occupations') {
      const res = await fetch(`${BLS_API_BASE}OEU4000000001?startyear=2022&endyear=2024`, { signal: AbortSignal.timeout(10000) });
      return NextResponse.json({ type: 'employment', source: 'Bureau of Labor Statistics', data: await res.json() });
    }
    if (action === 'wages') {
      const res = await fetch(`${BLS_API_BASE}SMU00000000000000001?startyear=2022&endyear=2024`, { signal: AbortSignal.timeout(10000) });
      return NextResponse.json({ type: 'wages', source: 'Bureau of Labor Statistics', data: await res.json() });
    }
    if (action === 'outlook') return NextResponse.json({ type: 'outlook', source: 'Bureau of Labor Statistics', data: { message: 'Use O*NET for detailed outlook data', url: `https://www.onetcodeconnector.org/find/occupation?o=${occupation}` } });
    if (action === 'search') return NextResponse.json({ type: 'search', source: 'Bureau of Labor Statistics', data: { message: 'Search via O*NET API', recommendation: 'Use /api/onet/careers?keyword=SEARCH_TERM' } });
    return NextResponse.json({ available: true, endpoints: ['GET ?action=occupations','GET ?action=wages','GET ?action=outlook','GET ?action=search'], attribution: 'Data from U.S. Bureau of Labor Statistics' });
  } catch { return NextResponse.json({ error: 'BLS API error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const { occupationCode, years = 3 } = await request.json();
  try {
    const res = await fetch(BLS_API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesid: ['OEU4000000001','SMU00000000000000001'], startyear: String(new Date().getFullYear() - years), endyear: String(new Date().getFullYear()) }), signal: AbortSignal.timeout(15000) });
    return NextResponse.json({ occupation: occupationCode, period: `${years} years`, data: await res.json(), attribution: 'U.S. Bureau of Labor Statistics' });
  } catch { return NextResponse.json({ error: 'Failed to fetch BLS data' }, { status: 500 }); }
}
