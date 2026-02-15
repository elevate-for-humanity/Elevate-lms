
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getCurrentUser, createServerSupabaseClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

    const supabase = await createServerSupabaseClient();

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    // Get leaderboard data from achievements
    const { data: leaderboard, error } = await supabase
      .from('achievements')
      .select(
        `
        user_id,
        users:user_id (
          id,
          email,
          full_name
        ),
        points
      `
      )
      .gte('earned_at', startDate.toISOString())
      .order('points', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

    // Aggregate points by user
    const userPoints = {};
    leaderboard?.forEach((entry) => {
      const userId = entry.user_id;
      if (!userPoints[userId]) {
        userPoints[userId] = {
          user: entry.users,
          totalPoints: 0,
        };
      }
      userPoints[userId].totalPoints += entry.points || 0;
    });

    const rankedLeaderboard = Object.values(userPoints)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      timeframe,
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
