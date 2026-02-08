export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/mobile/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // 1) Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    // 2) Get course counts
    const { count: totalCourses } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get completed courses (progress >= 100%)
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id);

    let completedCount = 0;
    if (enrollments) {
      for (const enrollment of enrollments) {
        // Get total lessons
        const { data: modules } = await supabase
          .from("modules")
          .select("id")
          .eq("course_id", enrollment.course_id);

        const moduleIds = modules?.map((m) => m.id) || [];

        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);

        const totalLessons = lessons?.length || 0;

        // Get completed lessons
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("completed", true);

        const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || []);
        const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0;

        if (totalLessons > 0 && completedLessons >= totalLessons) {
          completedCount++;
        }
      }
    }

    // 3) Get certificates count
    const { count: certificatesCount } = await supabase
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 4) Get streak (from learning_activity table or calculate)
    const { data: streakData } = await supabase
      .from("learning_activity")
      .select("current_streak")
      .eq("user_id", user.id)
      .single();

    const response = {
      name: profile?.full_name || user.email?.split("@")[0] || "Elevate Learner",
      email: user.email || "",
      avatarUrl: profile?.avatar_url || null,
      totalCourses: totalCourses || 0,
      completedCourses: completedCount,
      certificatesCount: certificatesCount || 0,
      streakDays: streakData?.current_streak || 0,
    };

    return NextResponse.json(response);
  } catch (error) { /* Error handled silently */ 
    logger.error("[Mobile Profile Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
