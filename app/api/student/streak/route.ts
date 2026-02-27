import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from "@/lib/auth";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(_req: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: activityToday }, { data: goalRow }, { data: streakRow }] =
    await Promise.all([
      db
        .from("learning_activity")
        .select("seconds_watched")
        .eq("user_id", user.id)
        .eq("activity_date", today)
        .maybeSingle(),
      db
        .from("learning_goals")
        .select("daily_minutes")
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("daily_streaks")
        .select("current_streak, longest_streak, last_active_date")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const secondsToday = activityToday?.seconds_watched ?? 0;
  const minutesToday = Math.round(secondsToday / 60);
  const dailyMinutes = goalRow?.daily_minutes ?? 20;

  const currentStreak = streakRow?.current_streak ?? 0;
  const longestStreak = streakRow?.longest_streak ?? 0;

  return NextResponse.json({
    minutesToday,
    dailyMinutes,
    currentStreak,
    longestStreak,
  });
}
export const GET = withApiAudit('/api/student/streak', _GET);
