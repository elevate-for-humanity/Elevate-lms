export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/programs/featured/route.ts
// Cached featured programs endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from "@/lib/supabase-api";
import { cacheGet, cacheSet } from '@/lib/cache';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(_req: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  const cacheKey = 'programs:featured';

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({ programs: cached, cached: true });
  }

  // Fetch from database
  const { data, error }: any = await db
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
