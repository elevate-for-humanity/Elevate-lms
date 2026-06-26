import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/admin/course-builder/lesson-patch
 *
 * Lightweight inline lesson update for the LiveCourseBuilder editor.
 * Only updates the fields the editor exposes — title, content, video_url,
 * lesson_type (step_type), duration_minutes, passing_score, status.
 *
 * The full lesson POST route handles schema-level creation with all
 * compliance fields. This route handles quick in-place edits.
 */
export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { lessonId, ...fields } = body as {
    lessonId: string;
    title?: string;
    content?: string;
    video_url?: string | null;
    step_type?: string;
    duration_minutes?: number | null;
    passing_score?: number | null;
    status?: 'draft' | 'published';
  };

  if (!lessonId) return safeError('lessonId is required', 400);

  // Build update payload — only include fields that were sent
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.content !== undefined) update.content = fields.content;
  if (fields.video_url !== undefined) update.video_url = fields.video_url;
  if (fields.step_type !== undefined) update.lesson_type = fields.step_type;
  if (fields.duration_minutes !== undefined) update.duration_minutes = fields.duration_minutes;
  if (fields.passing_score !== undefined) update.passing_score = fields.passing_score;
  if (fields.status !== undefined) update.status = fields.status;

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('course_lessons')
    .update(update)
    .eq('id', lessonId)
    .select('id, title, lesson_type, status, updated_at')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to update lesson');
  if (!data) return safeError('Lesson not found', 404);

  return NextResponse.json({ ok: true, lesson: data });
}
