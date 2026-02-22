
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/mobile/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get user's enrolled courses
    const { data: enrollments, error: enrollError } = await db
      .from("enrollments")
      .select(`
        id,
        course_id,
        started_at,
        courses (
          id,
          title,
          description,
          thumbnail_url
        )
      `)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (enrollError) {
      logger.error("[Mobile Courses Error]:", enrollError);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    // Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.course_id;
        const course = enrollment.courses;

        if (!course) return null;

        // Get total lessons in course
        const { data: modules } = await db
          .from("modules")
          .select("id")
          .eq("course_id", courseId);

        const moduleIds = modules?.map((m) => m.id) || [];

        const { data: lessons } = await db
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);

        const totalLessons = lessons?.length || 0;

        // Get completed lessons
        const { data: progress } = await db
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("user_id", user.id)
          .eq("completed", true);

        const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || []);
        const completedCount = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0;

        const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        // Get next lesson
        const nextLesson = lessons?.find((l) => !completedLessonIds.has(l.id));
        let nextLessonTitle = undefined;

        if (nextLesson) {
          const { data: lessonData } = await db
            .from("lessons")
            .select("title")
            .eq("id", nextLesson.id)
            .single();
          nextLessonTitle = lessonData?.title;
        }

        return {
          id: course.id,
          title: course.course_name,
          shortDescription: course.description?.substring(0, 100) || "No description available",
          thumbnailUrl: course.thumbnail_url,
          progressPercent,
          nextLessonTitle,
        };
      })
    );

    const validCourses = coursesWithProgress.filter((c) => c !== null);

    return NextResponse.json(validCourses);
  } catch (error) { 
    logger.error("[Mobile Courses Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
