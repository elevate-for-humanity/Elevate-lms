export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/help/search/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseClient } from "@/lib/supabase-api";
import { sanitizeSearchInput } from '@/lib/utils';


export async function GET(request: Request) {
  const supabase = createSupabaseClient();
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
