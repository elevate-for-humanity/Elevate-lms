import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { AdminAction, logAdminAudit } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const payload = {
      quiz_id: body.quiz_id,
      question_text: body.question_text,
      question_type: body.question_type,
      options: body.options ?? null,
      correct_answer: body.correct_answer,
      points: body.points ?? 1,
      order_index: body.order_index ?? 0,
    };

    const { data, error } = await db.from('quiz_questions').insert(payload).select('*').single();
    if (error) return safeError('Failed to create quiz question', 400);

    await logAdminAudit({
      action: AdminAction.QUIZ_QUESTION_CREATED,
      actorId: auth.id,
      entityType: 'quiz_questions',
      entityId: data.id,
      metadata: { quiz_id: payload.quiz_id },
    });

    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

async function _PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) return safeError('Question id is required', 400);

    const payload = {
      question_text: body.question_text,
      question_type: body.question_type,
      options: body.options ?? null,
      correct_answer: body.correct_answer,
      points: body.points ?? 1,
      order_index: body.order_index ?? 0,
    };

    const { data, error } = await db.from('quiz_questions').update(payload).eq('id', id).select('*').single();
    if (error) return safeError('Failed to update quiz question', 400);

    await logAdminAudit({
      action: AdminAction.QUIZ_QUESTION_UPDATED,
      actorId: auth.id,
      entityType: 'quiz_questions',
      entityId: id,
      metadata: {},
    });

    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

async function _DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) return safeError('Question id is required', 400);

    const { error } = await db.from('quiz_questions').delete().eq('id', id);
    if (error) return safeError('Failed to delete quiz question', 400);

    await logAdminAudit({
      action: AdminAction.QUIZ_QUESTION_DELETED,
      actorId: auth.id,
      entityType: 'quiz_questions',
      entityId: id,
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

export const POST = withApiAudit('/api/admin/courses/quiz-questions', _POST);
export const PATCH = withApiAudit('/api/admin/courses/quiz-questions', _PATCH);
export const DELETE = withApiAudit('/api/admin/courses/quiz-questions', _DELETE);
