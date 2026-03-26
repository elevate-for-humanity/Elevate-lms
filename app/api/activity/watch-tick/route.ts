
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function awardAchievement(
  supabase: any,
  userId: string,
  code: string,
  label: string,
  description: string
) {
  // Safe upsert: unique (user_id, code) in DB
  const { error } = await supabase.from("achievements").upsert(
    {
      user_id: userId,
      code,
      label,
      description,
    },
    { onConflict: "user_id,code" }
  );

  if (error) {
    logger.error("awardAchievement error", error instanceof Error ? error : new Error(String(error)), { code });
  }
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seconds } = await req.json();

  if (
    typeof seconds !== "number" ||
    Number.isNaN(seconds) ||
    seconds <= 0 ||
    seconds > 600 // sanity cap (10 minutes)
  ) {
    return NextResponse.json({ error: "Invalid seconds" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1) Upsert today's activity
  const { error: activityError } = await supabase
    .from("learning_activity")
    .upsert(
      {
        user_id: user.id,
        activity_date: today,
        seconds_watched: seconds,
      },
      {
        onConflict: "user_id,activity_date",
      }
    );

  if (activityError) {
    logger.error("learning_activity upsert error", activityError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // 2) Fetch updated total seconds for today
  const { data: activityToday, error: activityTodayError } = await supabase
    .from("learning_activity")
    .select("seconds_watched")
    .eq("user_id", user.id)
    .eq("activity_date", today)
    .maybeSingle();

  if (activityTodayError) {
    logger.error("learning_activity fetch error", activityTodayError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const secondsToday = activityToday?.seconds_watched || 0;

  // 3) Get goal (default 20 minutes if none)
  const { data: goalRow } = await supabase
    .from("learning_goals")
    .select("daily_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  const dailyMinutes = goalRow?.daily_minutes ?? 20;
  const dailyGoalSeconds = dailyMinutes * 60;

  // 4) Get or init streak
  const { data: streakRow } = await supabase
    .from("daily_streaks")
    .select("id, current_streak, longest_streak, last_active_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const todayDate = new Date(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate: string | null = null;

  const reachedGoalToday = secondsToday >= dailyGoalSeconds;

  if (!streakRow) {
    // create base streak row
    currentStreak = reachedGoalToday ? 1 : 0;
    longestStreak = currentStreak;
    lastActiveDate = reachedGoalToday ? today : null;

    const { error: insertError } = await supabase.from("daily_streaks").insert({
      user_id: user.id,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: lastActiveDate || today,
    });

    if (insertError) {
      logger.error("daily_streaks insert error", insertError);
    }
  } else {
    currentStreak = streakRow.current_streak;
    longestStreak = streakRow.longest_streak;
    lastActiveDate = streakRow.last_active_date;

    // Only update streak the first time they hit goal for the day
    if (reachedGoalToday) {
      if (lastActiveDate === today) {
        // already counted today
      } else if (lastActiveDate === yesterdayStr) {
        // consecutive day
        currentStreak += 1;
      } else {
        // streak broken, restart
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      const { error: updateError } = await supabase
        .from("daily_streaks")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_active_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        logger.error("daily_streaks update error", updateError);
      }
    }
  }

  // 5) === ACHIEVEMENTS ===
  //    Basic set: daily big study + streak milestones

  // Big study day achievements
  if (secondsToday >= 30 * 60) {
    await awardAchievement(
      supabase,
      user.id,
      "BIG_DAY_30",
      "30-Minute Grind",
      "Completed at least 30 minutes of learning in a single day."
    );
  }
  if (secondsToday >= 60 * 60) {
    await awardAchievement(
      supabase,
      user.id,
      "BIG_DAY_60",
      "1-Hour Power Session",
      "Completed at least 60 minutes of learning in a single day."
    );
  }

  // Streak achievements (only when they've hit goal for today)
  if (reachedGoalToday) {
    if (currentStreak >= 3) {
      await awardAchievement(
        supabase,
        user.id,
        "STREAK_3",
        "3-Day Streak",
        "Hit your daily learning goal 3 days in a row."
      );
    }
    if (currentStreak >= 7) {
      await awardAchievement(
        supabase,
        user.id,
        "STREAK_7",
        "7-Day Streak",
        "Hit your daily learning goal 7 days in a row."
      );
    }
    if (currentStreak >= 30) {
      await awardAchievement(
        supabase,
        user.id,
        "STREAK_30",
        "30-Day Streak",
        "Hit your daily learning goal 30 days in a row."
      );
    }
  }

  return NextResponse.json({
    secondsToday,
    dailyMinutes,
    currentStreak,
    longestStreak,
  });
}
export const POST = withApiAudit('/api/activity/watch-tick', _POST);
