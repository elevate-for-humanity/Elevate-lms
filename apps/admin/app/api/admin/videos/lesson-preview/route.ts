import { NextRequest, NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/admin/guards";
import { requireAdminClient } from "@/lib/supabase/admin";
import { createPortalPreviewHandoff } from "@/lib/admin/portal-preview-handoff";
import { applyRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

/** Read-only native LMS review for manually completed lessons. No authoring or queues. */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, "api");
  if (limited) return limited;
  const actor = await apiRequireAdmin(request);
  if (actor.error) return actor.error;
  const courseId = request.nextUrl.searchParams.get("courseId")?.trim() || "";
  const lessonId = request.nextUrl.searchParams.get("lessonId")?.trim() || "";
  if (!UUID.test(courseId) || !UUID.test(lessonId)) {
    return NextResponse.json(
      { error: "Valid course and lesson identifiers required" },
      { status: 400, headers },
    );
  }
  const db = await requireAdminClient();
  const { data: lesson, error } = await db
    .from("course_lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Unable to read saved lesson" },
      { status: 503, headers },
    );
  if (!lesson)
    return NextResponse.json(
      { error: "Lesson not found in this course" },
      { status: 404, headers },
    );
  const destination = new URL(
    "/api/admin/course-preview",
    process.env.NEXT_PUBLIC_LMS_URL || "https://app.elevateforhumanity.org",
  );
  destination.searchParams.set(
    "handoff",
    createPortalPreviewHandoff(actor.id, courseId),
  );
  destination.searchParams.set("lessonId", lessonId);
  const response = NextResponse.redirect(destination);
  for (const [key, value] of Object.entries(headers))
    response.headers.set(key, value);
  return response;
}
