
// app/api/help/search/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const supabase = await getAdminClient();
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const sanitizedQ = sanitizeSearchInput(q);

  const { data: results, error } = await supabase
    .from('help_articles')
    .select('*')
    .or(`title.ilike.%${sanitizedQ}%,body.ilike.%${sanitizedQ}%`)
    .limit(20)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  return NextResponse.json({
    results: (results || []).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      audience: r.audience,
      snippet: r.body.slice(0, 180),
    })),
  });
}
export const GET = withApiAudit('/api/help/search', _GET);
