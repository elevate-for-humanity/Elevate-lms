export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/courses/authoring/route.ts
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

    // Check if user is admin or instructor
    const { data: profile } = await db
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["admin", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get courses created by this user or all if admin
    let query = db
      .from("training_courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (profile.role !== "admin") {
      query = query.eq("created_by", user.id);
    }

    const { data: courses, error } = await query;

    if (error) {
      logger.error("Error fetching courses:", error);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ courses: courses || [] });
  } catch (error) { 
    logger.error("[Course Authoring Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Check if user is admin or instructor
    const { data: profile } = await db
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["admin", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      level,
      duration,
      modules,
      settings,
    } = body;

    // Create course
    const { data: course, error: courseError } = await db
      .from("training_courses")
      .insert({
        title,
        description,
        category,
        level,
        duration,
        created_by: user.id,
        status: "draft",
        settings,
      })
      .select()
      .single();

    if (courseError) {
      logger.error("Error creating course:", courseError);
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    // Create modules if provided
    if (modules && Array.isArray(modules) && modules.length > 0) {
      const moduleInserts = modules.map((module: Record<string, any>, index: number) => ({
        course_id: course.id,
        title: module.title,
        description: module.description,
        order: index + 1,
      }));

      const { error: modulesError } = await db
        .from("course_modules")
        .insert(moduleInserts);

      if (modulesError) {
        logger.error("Error creating modules:", modulesError);
        // Don't fail the whole request, course is still created
      }
    }

    return NextResponse.json({
      success: true,
      course_id: course.id,
      course,
    });
  } catch (error) { 
    logger.error("[Course Creation Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
