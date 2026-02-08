export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/mobile/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get enrollments count
    const { count: enrollmentsCount } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    // Get completed courses count
    const { count: completedCount } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    // Get certificates count
    const { count: certificatesCount } = await supabase
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_revoked", false);

    // Get unread forum posts count
    const { count: unreadForumsCount } = await supabase
      .from("discussion_threads")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // Get study groups count
    const { count: studyGroupsCount } = await supabase
      .from("study_group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get current streak
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .single();

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentActivityCount } = await supabase
      .from("lesson_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("updated_at", sevenDaysAgo.toISOString());

    return NextResponse.json({
      activeEnrollments: enrollmentsCount || 0,
      completedCourses: completedCount || 0,
      certificates: certificatesCount || 0,
      unreadForums: unreadForumsCount || 0,
      studyGroups: studyGroupsCount || 0,
      currentStreak: streakData?.current_streak || 0,
      longestStreak: streakData?.longest_streak || 0,
      recentActivity: recentActivityCount || 0,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error("[Mobile Summary Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
