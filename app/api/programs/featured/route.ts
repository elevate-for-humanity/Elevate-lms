export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/programs/featured/route.ts
// Cached featured programs endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(_req: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const cacheKey = 'programs:featured';

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({ programs: cached, cached: true });
  }

  // Fetch from database
  const { data, error }: any = await supabase
    .from('programs')
    .select('*')
    .eq('is_featured', true)
    .eq('is_published', true)
    .limit(12);

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Cache for 5 minutes
  await cacheSet(cacheKey, data, 300);

  return NextResponse.json({ programs: data, cached: false });
}
export const GET = withApiAudit('/api/programs/featured', _GET);
