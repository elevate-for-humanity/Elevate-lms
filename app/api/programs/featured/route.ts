// PUBLIC ROUTE: public featured programs list

// app/api/programs/featured/route.ts
// Cached featured programs endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cacheGet, cacheSet } from '@/lib/cache';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
  try { const rl = await applyRateLimit(req, 'api'); if (rl) return rl; } catch {}
  let supabase: Awaited<ReturnType<typeof getAdminClient>> | null = null;
  try { supabase = await getAdminClient(); } catch {}
  if (!supabase) return NextResponse.json({ programs: [], cached: false });
  const cacheKey = 'programs:featured';

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(
      { programs: cached, cached: true },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
    );
  }

  // Fetch from database
  const { data, error }: any = await supabase!
    .from('programs')
    .select('*')
    .eq('featured', true)
    .eq('published', true)
    .limit(12);

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Cache for 5 minutes
  await cacheSet(cacheKey, data, 300);

  return NextResponse.json(
    { programs: data, cached: false },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
  );
  } catch (err) {
    return NextResponse.json({ programs: [], cached: false });
  }
}
export const GET = withApiAudit('/api/programs/featured', _GET);
