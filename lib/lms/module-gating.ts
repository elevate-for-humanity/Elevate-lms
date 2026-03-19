/**
 * Module gating — deterministic unlock logic.
 *
 * Single source of truth for whether a student can access a module.
 * No UI override. No fallback. If the DB says locked, it is locked.
 *
 * DB enforces rules via:
 *   - module_completion_rules  (what must be true before a module unlocks)
 *   - student_module_progress  (per-student module state)
 *   - check_module_unlock()    (DB function — authoritative)
 *   - trg_lesson_complete_unlock (trigger — auto-unlocks next module on lesson completion)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type ModuleStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';

export interface ModuleWithStatus {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  status: ModuleStatus;
  unlocked_at: string | null;
  completed_at: string | null;
  lesson_count: number;
  completed_lesson_count: number;
}

/**
 * Returns all modules for a course with the student's current status.
 * Module 1 is always unlocked. All others depend on rules.
 * NEVER returns a locked module as accessible — callers must respect status.
 */
export async function getModulesWithStatus(
  db: SupabaseClient,
  courseId: string,
  userId: string,
): Promise<ModuleWithStatus[]> {
  // Get modules with lesson counts
  const { data: modules, error: modErr } = await db
    .from('course_modules')
    .select(`
      id,
      course_id,
      title,
      order_index,
      course_lessons(id, is_required)
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modErr) throw modErr;
  if (!modules?.length) return [];

  // Get student progress for all modules in one query
  const { data: progress } = await db
    .from('student_module_progress')
    .select('module_id, status, unlocked_at, completed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  const progressMap = new Map(
    (progress ?? []).map(p => [p.module_id, p]),
  );

  // Get completed lessons for this student in this course
  const { data: completedLessons } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true);

  const completedSet = new Set((completedLessons ?? []).map(l => l.lesson_id));

  return modules.map((mod, idx) => {
    const prog = progressMap.get(mod.id);
    const lessons = (mod.course_lessons as { id: string; is_required: boolean }[]) ?? [];
    const requiredLessons = lessons.filter(l => l.is_required);
    const completedCount = requiredLessons.filter(l => completedSet.has(l.id)).length;

    // Module 1 is always unlocked if no progress record exists
    let status: ModuleStatus = prog?.status ?? (idx === 0 ? 'unlocked' : 'locked');

    // Derive in_progress from lesson completion if DB hasn't caught up
    if (status === 'unlocked' && completedCount > 0) {
      status = 'in_progress';
    }
    if (status === 'in_progress' && completedCount === requiredLessons.length && requiredLessons.length > 0) {
      status = 'completed';
    }

    return {
      id: mod.id,
      course_id: mod.course_id,
      title: mod.title,
      order_index: mod.order_index,
      status,
      unlocked_at: prog?.unlocked_at ?? (idx === 0 ? new Date().toISOString() : null),
      completed_at: prog?.completed_at ?? null,
      lesson_count: requiredLessons.length,
      completed_lesson_count: completedCount,
    };
  });
}

/**
 * Checks whether a specific module is accessible to a student.
 * Calls the DB function — authoritative, no client-side override.
 */
export async function canAccessModule(
  db: SupabaseClient,
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<boolean> {
  const { data, error } = await db.rpc('check_module_unlock', {
    p_user_id: userId,
    p_course_id: courseId,
    p_module_id: moduleId,
  });

  if (error) throw error;
  return data === true;
}

/**
 * Initializes module progress for a student enrolling in a course.
 * Module 1 is unlocked immediately. All others start locked.
 */
export async function initializeModuleProgress(
  db: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<void> {
  const { data: modules, error } = await db
    .from('course_modules')
    .select('id, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  if (!modules?.length) return;

  const rows = modules.map((mod, idx) => ({
    user_id: userId,
    course_id: courseId,
    module_id: mod.id,
    status: idx === 0 ? 'unlocked' : 'locked',
    unlocked_at: idx === 0 ? new Date().toISOString() : null,
  }));

  const { error: insertErr } = await db
    .from('student_module_progress')
    .upsert(rows, { onConflict: 'user_id,module_id', ignoreDuplicates: true });

  if (insertErr) throw insertErr;
}
