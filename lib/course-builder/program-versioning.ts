/**
 * lib/course-builder/program-versioning.ts
 *
 * Snapshot-on-publish versioning for programs and courses.
 * Mirrors the lesson versioning pattern in versioning.ts.
 *
 * publishProgram()  — snapshots full program state, increments version
 * publishCourse()   — snapshots course + modules + lessons, increments version
 * rollbackProgram() — restores program from a prior snapshot (sets to draft)
 * rollbackCourse()  — restores course from a prior snapshot (sets to draft)
 * listProgramVersions() / listCourseVersions() — version history
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VersionSummary = {
  id: string;
  version: number;
  created_at: string;
  created_by: string | null;
};

export type PublishResult = { ok: boolean; version?: number; error?: string; blocked?: boolean };
export type RollbackResult = { ok: boolean; rolledBackTo?: number; error?: string };

// ── publishProgram ────────────────────────────────────────────────────────────

export async function publishProgram(
  db: SupabaseClient,
  programId: string,
  publishedBy: string,
): Promise<PublishResult> {
  const { data: version, error } = await db.rpc('publish_catalog_program', {
    p_program_id: programId,
    p_actor_id: publishedBy,
  });
  if (error) {
    const blocked = error.code === '23514' && error.message.startsWith('PUBLISH_BLOCKED: ');
    if (blocked) {
      return { ok: false, blocked, error: error.message.slice('PUBLISH_BLOCKED: '.length) };
    }
    logger.error('[program-versioning] publish failed', error, { programId });
    return { ok: false, error: error.message };
  }

  logger.info('[program-versioning] program published', { programId, publishedBy, version });
  return { ok: true, version };
}

// ── publishCourse ─────────────────────────────────────────────────────────────

export async function publishCourse(
  db: SupabaseClient,
  courseId: string,
  publishedBy: string,
): Promise<PublishResult> {
  const { data: course, error: loadErr } = await db
    .from('courses')
    .select('*, course_modules(*, course_lessons(*))')
    .eq('id', courseId)
    .maybeSingle();

  if (loadErr) return { ok: false, error: loadErr.message };
  if (!course) return { ok: false, error: 'Course not found' };

  const nextVersion = (course.version ?? 0) + 1;
  const now = new Date().toISOString();
  const orgId = course.org_id;

  if (!orgId)
    return { ok: false, error: 'Course has no org_id — apply migration 20260422000003 first' };

  const { error: snapErr } = await db.from('course_versions').insert({
    org_id: orgId,
    course_id: courseId,
    version: nextVersion,
    snapshot: course,
    created_by: publishedBy,
    created_at: now,
  });

  if (snapErr) {
    logger.error('[program-versioning] course snapshot failed', undefined, {
      courseId,
      error: snapErr.message,
    });
    return { ok: false, error: snapErr.message };
  }

  const { error: updateErr } = await db
    .from('courses')
    .update({
      version: nextVersion,
      status: 'published',
      review_status: 'published',
      published_at: now,
      published_by: publishedBy,
      updated_at: now,
    })
    .eq('id', courseId);

  if (updateErr) return { ok: false, error: updateErr.message };

  logger.info('[program-versioning] course published', { courseId, version: nextVersion });
  return { ok: true, version: nextVersion };
}

// ── rollbackProgram ───────────────────────────────────────────────────────────

export async function rollbackProgram(
  db: SupabaseClient,
  programId: string,
  targetVersion: number,
  rolledBackBy: string,
): Promise<RollbackResult> {
  const { data: snap, error } = await db
    .from('program_versions')
    .select('snapshot')
    .eq('program_id', programId)
    .eq('version', targetVersion)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!snap) return { ok: false, error: `Version ${targetVersion} not found` };

  const s = snap.snapshot as any;

  // Restore core fields only — nested tables require separate restore
  const { error: updateErr } = await db
    .from('programs')
    .update({
      title: s.title,
      description: s.description,
      short_description: s.short_description,
      status: 'draft',
      review_status: 'draft',
      published: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId);

  if (updateErr) return { ok: false, error: updateErr.message };

  logger.info('[program-versioning] program rolled back', {
    programId,
    targetVersion,
    rolledBackBy,
  });
  return { ok: true, rolledBackTo: targetVersion };
}

// ── rollbackCourse ────────────────────────────────────────────────────────────

export async function rollbackCourse(
  db: SupabaseClient,
  courseId: string,
  targetVersion: number,
  rolledBackBy: string,
): Promise<RollbackResult> {
  const { data: snap, error } = await db
    .from('course_versions')
    .select('snapshot')
    .eq('course_id', courseId)
    .eq('version', targetVersion)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!snap) return { ok: false, error: `Version ${targetVersion} not found` };

  const s = snap.snapshot as any;

  const { error: updateErr } = await db
    .from('courses')
    .update({
      title: s.title,
      description: s.description,
      status: 'draft',
      review_status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId);

  if (updateErr) return { ok: false, error: updateErr.message };

  logger.info('[program-versioning] course rolled back', { courseId, targetVersion, rolledBackBy });
  return { ok: true, rolledBackTo: targetVersion };
}

// ── list helpers ──────────────────────────────────────────────────────────────

export async function listProgramVersions(
  db: SupabaseClient,
  programId: string,
): Promise<VersionSummary[]> {
  const { data } = await db
    .from('program_versions')
    .select('id, version, created_at, created_by')
    .eq('program_id', programId)
    .order('version', { ascending: false });
  return data ?? [];
}

export async function listCourseVersions(
  db: SupabaseClient,
  courseId: string,
): Promise<VersionSummary[]> {
  const { data } = await db
    .from('course_versions')
    .select('id, version, created_at, created_by')
    .eq('course_id', courseId)
    .order('version', { ascending: false });
  return data ?? [];
}
