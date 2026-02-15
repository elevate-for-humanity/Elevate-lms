import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getStoreCards } from '@/lib/store/db';

export async function GET() {
  try {
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
