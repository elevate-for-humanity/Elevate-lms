import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError, safeError } from '@/lib/api/safe-error';
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
      course_id: body.course_id,
      title: body.title,
      description: body.description ?? null,
      time_limit_minutes: body.time_limit_minutes ?? null,
      passing_score: body.passing_score ?? 70,
      max_attempts: body.max_attempts ?? 3,
    };

    const { data, error } = await db.from('quizzes').insert(payload).select('*').single();
    if (error) return safeError('Failed to create quiz', 400);

    await logAdminAudit({
      action: AdminAction.QUIZ_CREATED,
      actorId: auth.id,
      entityType: 'quizzes',
      entityId: data.id,
      metadata: { course_id: payload.course_id, title: payload.title },
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
    const quizId = String(body.id || '').trim();
    if (!quizId) return safeError('Quiz id is required', 400);

    const payload = {
      title: body.title,
      description: body.description ?? null,
      time_limit_minutes: body.time_limit_minutes ?? null,
      passing_score: body.passing_score ?? 70,
      max_attempts: body.max_attempts ?? 3,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db.from('quizzes').update(payload).eq('id', quizId).select('*').single();
    if (error) return safeError('Failed to update quiz', 400);

    await logAdminAudit({
      action: AdminAction.QUIZ_UPDATED,
      actorId: auth.id,
      entityType: 'quizzes',
      entityId: quizId,
      metadata: { title: payload.title },
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
    const quizId = String(body.id || '').trim();
    if (!quizId) return safeError('Quiz id is required', 400);

    const { error } = await db.from('quizzes').delete().eq('id', quizId);
    if (error) return safeError('Failed to delete quiz', 400);

    await logAdminAudit({
      action: AdminAction.QUIZ_DELETED,
      actorId: auth.id,
      entityType: 'quizzes',
      entityId: quizId,
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

export const POST = withApiAudit('/api/admin/courses/quizzes', _POST);
export const PATCH = withApiAudit('/api/admin/courses/quizzes', _PATCH);
export const DELETE = withApiAudit('/api/admin/courses/quizzes', _DELETE);
