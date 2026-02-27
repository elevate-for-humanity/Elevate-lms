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

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  const { data, error }: any = await db
    .from("lesson_notes")
    .select("id, position_seconds, body, created_at")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("notes GET error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ notes: data || [] });
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
  const body = await req.json();
  const { text, body: noteBody, positionSeconds } = body;

  const noteText = text || noteBody;

  if (!noteText || !noteText.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const { error } = await db.from("lesson_notes").insert({
    user_id: user.id,
    lesson_id: lessonId,
    body: noteText,
    position_seconds:
      typeof positionSeconds === "number" ? Math.floor(positionSeconds) : null,
  });

  if (error) {
    logger.error("notes POST error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
export const GET = withApiAudit('/api/lessons/[lessonId]/notes', _GET);
export const POST = withApiAudit('/api/lessons/[lessonId]/notes', _POST);
