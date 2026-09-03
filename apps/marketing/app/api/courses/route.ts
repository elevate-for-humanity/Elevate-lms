import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 24;

function corsHeaders(origin: string | null) {
  // Course catalog data is public and intentionally embeddable. No credentials
  // or private learner information are returned from this endpoint.
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  });
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const requestedLimit = Number(req.nextUrl.searchParams.get('limit') || 6);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.trunc(requestedLimit)))
    : 6;
  const category = req.nextUrl.searchParams.get('category')?.trim() || null;

  try {
    const db = await requireAdminClient();
    let query = db
      .from('courses')
      .select('id,slug,title,short_description,description,thumbnail_url,duration_hours,category,status,is_active')
      .eq('is_active', true)
      .eq('status', 'published')
      .order('title', { ascending: true })
      .limit(limit);

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { data: [], error: 'Course catalog is temporarily unavailable' },
        { status: 503, headers: corsHeaders(req.headers.get('origin')) },
      );
    }

    return NextResponse.json(
      { data: data ?? [] },
      { status: 200, headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch {
    return NextResponse.json(
      { data: [], error: 'Course catalog is temporarily unavailable' },
      { status: 503, headers: corsHeaders(req.headers.get('origin')) },
    );
  }
}
