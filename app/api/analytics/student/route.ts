export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/analytics/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's enrollments
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id);

    const courseIds = enrollments?.map((e) => e.course_id) || [];

    // Calculate completion rate
    let totalLessons = 0;
    let completedLessons = 0;

    for (const courseId of courseIds) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      const moduleIds = modules?.map((m) => m.id) || [];

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds);

      totalLessons += lessons?.length || 0;

      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true);

      const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || []);
      completedLessons += lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0;
    }

    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Get learning activity for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activityData } = await supabase
      .from("learning_activity")
      .select("activity_date, minutes_spent")
      .eq("user_id", user.id)
      .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("activity_date", { ascending: true });

    // Fill in missing days with 0
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const activity = activityData?.find((a) => a.activity_date === dateStr);
      last7Days.push({
        date: dateStr,
        minutes: activity?.minutes_spent || 0,
      });
    }

    // Calculate average time per week
    const totalMinutes = last7Days.reduce((sum, day) => sum + day.minutes, 0);
    const averageTimePerWeekHours = totalMinutes / 60;

    // Get streak
    const { data: streakData } = await supabase
      .from("learning_activity")
      .select("current_streak")
      .eq("user_id", user.id)
      .single();

    // Count courses
    const coursesInProgress = courseIds.length;
    let coursesCompleted = 0;

    for (const courseId of courseIds) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      const moduleIds = modules?.map((m) => m.id) || [];

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds);

      const totalCourseLessons = lessons?.length || 0;

      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true);

      const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || []);
      const completedCourseLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0;

      if (totalCourseLessons > 0 && completedCourseLessons >= totalCourseLessons) {
        coursesCompleted++;
      }
    }

    const response = {
      completionRate,
      averageTimePerWeekHours,
      activeStreakDays: streakData?.current_streak || 0,
      coursesInProgress,
      coursesCompleted,
      last7Days,
    };

    return NextResponse.json(response);
  } catch (error) { /* Error handled silently */ 
    logger.error("[Student Analytics API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
