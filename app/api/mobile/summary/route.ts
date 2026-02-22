export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/mobile/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get enrollments count
    const { count: enrollmentsCount } = await db
      .from("program_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    // Get completed courses count
    const { count: completedCount } = await db
      .from("program_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    // Get certificates count
    const { count: certificatesCount } = await db
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_revoked", false);

    // Get unread forum posts count
    const { count: unreadForumsCount } = await db
      .from("discussion_threads")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // Get study groups count
    const { count: studyGroupsCount } = await db
      .from("study_group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get current streak
    const { data: streakData } = await db
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .single();

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentActivityCount } = await db
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
  } catch (error) { 
    logger.error("[Mobile Summary Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
