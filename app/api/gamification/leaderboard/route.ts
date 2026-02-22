export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error }: any = await supabase
      .from('leaderboard')
      .select(
        `
        *,
        user:profiles!user_id(full_name, email)
      `
      )
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ leaderboard: data });
  } catch (error) { 
    logger.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
