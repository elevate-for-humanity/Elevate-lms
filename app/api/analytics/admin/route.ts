export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/analytics/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // 1) Total learners (exclude staff/admin)
    const { count: totalLearners } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["student", "instructor"]);

    // 2) Get all enrollments for completion rate
    const { data: enrollments } = await db
      .from("program_enrollments")
      .select("user_id, course_id");

    const totalEnrollments = enrollments?.length || 0;
    let completedEnrollments = 0;

    // Calculate completion for each enrollment
    if (enrollments) {
      for (const enrollment of enrollments) {
        const { data: modules } = await db
          .from("modules")
          .select("id")
          .eq("course_id", enrollment.course_id);

        const moduleIds = modules?.map((m) => m.id) || [];

        const { data: lessons } = await db
          .from("training_lessons")
          .select("id")
          .in("module_id", moduleIds);

        const totalLessons = lessons?.length || 0;

        const { data: progress } = await db
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", enrollment.user_id)
          .eq("completed", true);

        const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || []);
        const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0;

        if (totalLessons > 0 && completedLessons >= totalLessons) {
          completedEnrollments++;
        }
      }
    }

    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // 3) At-risk count (students with < 50% progress)
    let atRiskCount = 0;
    if (enrollments) {
      for (const enrollment of enrollments) {
        const { data: modules } = await db
          .from("modules")
          .select("id")
          .eq("course_id", enrollment.course_id);

        const moduleIds = modules?.map((m) => m.id) || [];

        const { data: lessons } = await db
          .from("training_lessons")
          .select("id")
          .in("module_id", moduleIds);

        const totalLessons = lessons?.length || 0;

        const { data: progress } = await db
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", enrollment.user_id)
          .eq("completed", true);

        const completedLessons = progress?.length || 0;
        const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        if (progressPercent > 0 && progressPercent < 50) {
          atRiskCount++;
        }
      }
    }

    // 4) Active this week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentActivity } = await db
      .from("learning_activity")
      .select("user_id, minutes_spent")
      .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0]);

    const activeThisWeek = new Set(recentActivity?.map((a) => a.user_id) || []).size;

    const totalMinutesWeek = recentActivity?.reduce((sum, a) => sum + (a.minutes_spent || 0), 0) || 0;
    const averageTimePerWeekHours = totalLearners && totalLearners > 0
      ? totalMinutesWeek / 60 / totalLearners
      : 0;

    // 5) Program-level stats
    const { data: courses } = await db
      .from("training_courses")
      .select("id, title");

    const byProgram = [];

    if (courses) {
      for (const course of courses) {
        const { count: learnerCount } = await db
          .from("program_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id);

        const { data: courseEnrollments } = await db
          .from("program_enrollments")
          .select("user_id")
          .eq("course_id", course.id);

        let courseCompletedCount = 0;

        if (courseEnrollments) {
          for (const enrollment of courseEnrollments) {
            const { data: modules } = await db
              .from("modules")
              .select("id")
              .eq("course_id", course.id);

            const moduleIds = modules?.map((m) => m.id) || [];

            const { data: lessons } = await db
              .from("training_lessons")
              .select("id")
              .in("module_id", moduleIds);

            const totalLessons = lessons?.length || 0;

            const { data: progress } = await db
              .from("lesson_progress")
              .select("lesson_id")
              .eq("user_id", enrollment.user_id)
              .eq("completed", true);

            const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || []);
            const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0;

            if (totalLessons > 0 && completedLessons >= totalLessons) {
              courseCompletedCount++;
            }
          }
        }

        const courseCompletionRate = learnerCount && learnerCount > 0
          ? (courseCompletedCount / learnerCount) * 100
          : 0;

        byProgram.push({
          programName: course.course_name,
          learners: learnerCount || 0,
          completionRate: Math.round(courseCompletionRate),
        });
      }
    }

    const response = {
      totalLearners: totalLearners || 0,
      activeThisWeek,
      completionRate: Math.round(completionRate),
      averageTimePerWeekHours: Math.round(averageTimePerWeekHours * 10) / 10,
      atRiskCount,
      byProgram,
    };

    return NextResponse.json(response);
  } catch (error) { 
    logger.error("[Admin Analytics API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/analytics/admin', _GET);
