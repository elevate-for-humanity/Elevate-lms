import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return empty achievements for now - this feature needs to be built
    return NextResponse.json({
      achievements: [],
      stats: {
        totalPoints: 0,
        level: 1,
        streak: 0,
        totalAchievements: 0,
      },
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);

    if (!body.achievementId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Create achievement record
    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        achievement_id: body.achievementId,
        earned_at: new Date().toISOString(),
        points: body.points || 10
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
