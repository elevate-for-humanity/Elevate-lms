import { createClient } from '@/lib/supabase/server';
import { safeGetUser } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getJobMatches } from '@/lib/hub/job-matching';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const matches = await getJobMatches(userId);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Job matches API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

