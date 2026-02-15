import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { searchStore } from '@/lib/store/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const audience = searchParams.get('audience') || undefined;
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const results = await searchStore(query, audience, category, limit);
    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Search API error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
