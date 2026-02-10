import { NextResponse } from 'next/server';
import { getStoreCards } from '@/lib/store/db';
import { apiAuthGuard } from '@/lib/authGuards';

export async function GET() {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const cards = await getStoreCards();
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Store cards API error:', error);
    return NextResponse.json({ 
      primary: [], 
      secondary: [],
      error: 'Failed to fetch store cards' 
    }, { status: 500 });
  }
}
