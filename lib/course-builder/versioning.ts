/**
 * lib/course-builder/versioning.ts
 * Snapshot-on-publish versioning for course_lessons.
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type LessonVersion = {
  id: string;
  lesson_id: string;
  version: number;
  title: string;
  lesson_type: string;
  published_at: string;
  published_by: string | null;
  change_summary: string | null;
};

export type PublishResult = { ok: boolean; version?: number; versionId?: string; error?: string };
export type RollbackResult = { ok: boolean; rolledBackTo?: number; error?: string };

const SNAPSHOT_FIELDS = [
  'title', 'lesson_type', 'order_index', 'content', 'rendered_html', 'video_url', 'video_config',
  'quiz_questions', 'passing_score', 'practical_required', 'competency_checks', 'learning_objectives',
  'activities', 'duration_minutes', 'instructor_notes', 'status',
] as const;

export async function publishLesson(
  db: SupabaseClient,
  lessonId: string,
  publishedBy: string,
  changeSummary?: string,
): Promise<PublishResult> {
  const { data: lesson, error: loadErr } = await db
    .from('course_lessons')
    .select(`id, version, ${SNAPSHOT_FIELDS.join(', ')}`)
    .eq('id', lessonId)
    .maybeSingle();

  if (loadErr) return { ok: false, error: loadErr.message };
  if (!lesson) return { ok: false, error: 'Lesson not found' };

  const lessonRow = lesson as unknown as Record<string, any>;
  const nextVersion = Number(lessonRow.version ?? 0) + 1;
  const now = new Date().toISOString();

  const snapshot: Record<string, unknown> = {
    lesson_id: lessonId,
    version: nextVersion,
    published_at: now,
    published_by: publishedBy,
    change_summary: changeSummary ?? null,
  };
  for (const field of SNAPSHOT_FIELDS) snapshot[field] = lessonRow[field] ?? null;

  const { data: versionRow, error: snapErr } = await db
    .from('course_lesson_versions')
    .insert(snapshot)
    .select('id')
    .single();

  if (snapErr) {
    logger.error('[versioning] snapshot insert failed', undefined, { lessonId, error: snapErr.message });
    return { ok: false, error: snapErr.message };
  }

  const { error: updateErr } = await db
    .from('course_lessons')
    .update({
      version: nextVersion,
      published_at: now,
      published_by: publishedBy,
      previous_version_id: versionRow.id,
      status: 'published',
      is_published: true,
      updated_at: now,
    })
    .eq('id', lessonId);

  if (updateErr) {
    logger.error('[versioning] lesson update failed after snapshot', undefined, { lessonId, error: updateErr.message });
    return { ok: false, error: updateErr.message };
  }

  logger.info('[versioning] lesson published', { lessonId, version: nextVersion });
  return { ok: true, version: nextVersion, versionId: versionRow.id };
}

export async function rollbackLesson(
  db: SupabaseClient,
  lessonId: string,
  targetVersion: number,
  rolledBackBy: string,
): Promise<RollbackResult> {
  const { data: snapshot, error: snapErr } = await db
    .from('course_lesson_versions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('version', targetVersion)
    .maybeSingle();

  if (snapErr) return { ok: false, error: snapErr.message };
  if (!snapshot) return { ok: false, error: `Version ${targetVersion} not found for lesson ${lessonId}` };

  const restore: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of SNAPSHOT_FIELDS) restore[field] = (snapshot as any)[field] ?? null;
  restore.status = 'draft';
  restore.is_published = false;

  const { error: updateErr } = await db.from('course_lessons').update(restore).eq('id', lessonId);
  if (updateErr) {
    logger.error('[versioning] rollback failed', undefined, { lessonId, targetVersion, error: updateErr.message });
    return { ok: false, error: updateErr.message };
  }

  logger.info('[versioning] lesson rolled back', { lessonId, targetVersion, rolledBackBy });
  return { ok: true, rolledBackTo: targetVersion };
}

export async function getVersionHistory(
  db: SupabaseClient,
  lessonId: string,
): Promise<LessonVersion[]> {
  const { data, error } = await db
    .from('course_lesson_versions')
    .select('id, lesson_id, version, title, lesson_type, published_at, published_by, change_summary')
    .eq('lesson_id', lessonId)
    .order('version', { ascending: false });

  if (error) {
    logger.error('[versioning] failed to load version history', undefined, { lessonId, error: error.message });
    return [];
  }

  return (data ?? []) as LessonVersion[];
}
