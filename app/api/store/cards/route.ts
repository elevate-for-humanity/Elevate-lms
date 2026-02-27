import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getStoreCards } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const cards = await getStoreCards();
    return NextResponse.json(cards);
  } catch (error) {
    logger.error('Store cards API error:', error);
    return NextResponse.json({ 
      primary: [], 
      secondary: [],
      error: 'Failed to fetch store cards' 
    }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/store/cards', _GET);
