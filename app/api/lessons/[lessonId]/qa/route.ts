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
  const { lessonId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Q + A list (readable without login if you want)
  const { data: questions, error } = await db
    .from("lesson_questions")
    .select(
      `
      id,
      title,
      body,
      created_at,
      lesson_answers (
        id,
        body,
        created_at
      )
    `
    )
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("lesson_questions GET error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ questions: questions || [] });
}

// POST is multipurpose: kind = "question" | "answer"
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const { lessonId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body: errBody } = accessErrorResponse(e);
    return NextResponse.json(errBody, { status });
  }

  const { kind, questionId, title, body } = await req.json();

  if (!kind || (kind !== "question" && kind !== "answer")) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "Body required" }, { status: 400 });
  }

  if (kind === "question") {
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Question title required" },
        { status: 400 }
      );
    }

    const { data, error }: any = await db
      .from("lesson_questions")
      .insert({
        lesson_id: lessonId,
        author_id: user.id,
        title,
        body,
      })
      .select()
      .single();

    if (error) {
      logger.error("lesson_questions POST error", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ question: data });
  }

  // kind === "answer"
  if (!questionId) {
    return NextResponse.json(
      { error: "questionId required for answer" },
      { status: 400 }
    );
  }

  const { data, error }: any = await db
    .from("lesson_answers")
    .insert({
      question_id: questionId,
      author_id: user.id,
      body,
    })
    .select()
    .single();

  if (error) {
    logger.error("lesson_answers POST error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ answer: data });
}
export const GET  = withApiAudit('/api/lessons/[lessonId]/qa', _GET  as unknown as (req: Request, ...args: any[]) => Promise<Response>);
export const POST = withApiAudit('/api/lessons/[lessonId]/qa', _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>);
