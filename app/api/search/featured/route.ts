import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedForAudience } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required

export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const searchParams = request.nextUrl.searchParams;
  const audience = searchParams.get('audience') || 'everyone';
  const limit = parseInt(searchParams.get('limit') || '6');

  try {
    const results = await getFeaturedForAudience(audience, limit);
    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Featured API error:', error);
    return NextResponse.json({ results: [], error: 'Failed to fetch featured items' }, { status: 500 });
  }
}
