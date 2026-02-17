import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { searchStore } from '@/lib/store/db';
import { searchItems, getFeaturedForAudience, type Audience } from '@/lib/search/search-index';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const audience = (searchParams.get('audience') || undefined) as Audience | undefined;
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const source = searchParams.get('source') || 'all';

  try {
    // Search both the database store and the static search index
    const [storeResults, indexResults] = await Promise.all([
      source !== 'index' ? searchStore(query, audience, category, limit).catch(() => []) : Promise.resolve([]),
      query
        ? Promise.resolve(searchItems(query, audience, category).slice(0, limit))
        : audience
          ? Promise.resolve(getFeaturedForAudience(audience, limit))
          : Promise.resolve([]),
    ]);

    // Merge results, store results first, then index results that aren't duplicates
    const storeHrefs = new Set((storeResults as any[]).map((r: any) => r.href || r.url));
    const merged = [
      ...(storeResults as any[]),
      ...indexResults.filter((r) => !storeHrefs.has(r.href)),
    ].slice(0, limit);

    return NextResponse.json({ results: merged });
  } catch (error) {
    logger.error('Search API error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
