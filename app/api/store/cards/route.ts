import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getStoreCards } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

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
