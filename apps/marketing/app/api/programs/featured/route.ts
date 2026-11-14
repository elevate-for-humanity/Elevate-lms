import { safeInternalError } from '@/lib/api/safe-error';
// PUBLIC ROUTE: public featured programs list

// app/api/programs/featured/route.ts
// Cached featured programs endpoint
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { cacheGet, cacheSet } from '@/lib/cache';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
    const rl = await applyRateLimit(req, 'api');
    if (rl) return rl;
  } catch (e) {
    logger.warn('[rate-limit] applyRateLimit failed — continuing without limit', e);
  }
  let supabase: Awaited<ReturnType<typeof requireAdminClient>> | null = null;
  try {
    supabase = await requireAdminClient();
  } catch {
    /* non-fatal — falls back to anon client */
  }
  if (!supabase) return NextResponse.json({ programs: [], cached: false });
  const cacheKey = 'programs:featured';

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(
      { programs: cached, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  }

  // Fetch from database
  const { data, error }: any = await supabase!
    .from('programs')
    .select('*')
    .eq('is_featured', true)
    .eq('is_published', true)
    .limit(12);

  if (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }

  // Cache for 5 minutes
  await cacheSet(cacheKey, data, 300);

  return NextResponse.json(
    { programs: data, cached: false },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
export const GET = withApiAudit('/api/programs/featured', _GET);
