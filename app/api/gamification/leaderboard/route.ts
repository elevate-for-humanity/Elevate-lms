// PUBLIC ROUTE: public leaderboard display

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: rawLeaderboard, error }: any = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Hydrate profiles separately (leaderboard.user_id has no FK to profiles)
    const lbUserIds = [...new Set((rawLeaderboard ?? []).map((r: any) => r.user_id).filter(Boolean))];
    const { data: lbProfiles } = lbUserIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', lbUserIds)
      : { data: [] };
    const lbProfileMap = Object.fromEntries((lbProfiles ?? []).map((p: any) => [p.id, p]));
    const data = (rawLeaderboard ?? []).map((r: any) => ({ ...r, user: lbProfileMap[r.user_id] ?? null }));

    return NextResponse.json({ leaderboard: data });
  } catch (error) { 
    logger.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/gamification/leaderboard', _GET);
