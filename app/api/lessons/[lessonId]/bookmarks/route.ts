import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body } = accessErrorResponse(e);
    return NextResponse.json(body, { status });
  }

  const { data, error }: any = await db
    .from("video_bookmarks")
    .select("id, label, position_seconds, created_at")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .order("position_seconds", { ascending: true });

  if (error) {
    logger.error("bookmarks GET error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data || [] });
}

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body: errBody } = accessErrorResponse(e);
    return NextResponse.json(errBody, { status });
  }

  const body = await req.json();
  const { label, positionSeconds } = body;

  if (typeof positionSeconds !== "number") {
    return NextResponse.json(
      { error: "positionSeconds required as number" },
      { status: 400 }
    );
  }

  const { error } = await db.from("video_bookmarks").insert({
    user_id: user.id,
    lesson_id: lessonId,
    label: label || null,
    position_seconds: Math.floor(positionSeconds),
  });

  if (error) {
    logger.error("bookmarks POST error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
export const GET  = withApiAudit('/api/lessons/[lessonId]/bookmarks', _GET  as unknown as (req: Request, ...args: any[]) => Promise<Response>);
export const POST = withApiAudit('/api/lessons/[lessonId]/bookmarks', _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>);
