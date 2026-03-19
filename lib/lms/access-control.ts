/**
 * LMS access control — server-side enforcement only.
 *
 * Every lesson and module fetch MUST call assertLessonAccess or
 * assertModuleAccess before returning data to the client.
 * No client-side gating is sufficient on its own.
 *
 * Throws on denial — callers must not catch and continue.
 */

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Asserts the user can access a lesson.
 * Resolves the lesson's module, then calls check_module_unlock() in the DB.
 *
 * Throws 'ACCESS_DENIED' if the module is locked.
 * Throws 'LESSON_NOT_FOUND' if the lesson does not exist.
 * Throws the raw DB error on infrastructure failure.
 */
export async function assertLessonAccess(
  userId: string,
  lessonId: string,
): Promise<void> {
  const db = createAdminClient();
  if (!db) throw new Error('DB_UNAVAILABLE');

  const { data, error } = await db.rpc('can_access_lesson', {
    p_user_id:  userId,
    p_lesson_id: lessonId,
  });

  if (error) throw error;
  if (data === null) throw new Error('LESSON_NOT_FOUND');
  if (data === false) throw new Error('ACCESS_DENIED');
}

/**
 * Asserts the user can access a module directly.
 * Used by module-level routes (e.g. GET /api/lms/modules/[moduleId]).
 *
 * Throws 'ACCESS_DENIED' if locked.
 */
export async function assertModuleAccess(
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<void> {
  const db = createAdminClient();
  if (!db) throw new Error('DB_UNAVAILABLE');

  const { data, error } = await db.rpc('check_module_unlock', {
    p_user_id:   userId,
    p_course_id: courseId,
    p_module_id: moduleId,
  });

  if (error) throw error;
  if (!data) throw new Error('ACCESS_DENIED');
}

/**
 * Converts an access-control error into an HTTP response shape.
 * Use in route handlers to return the correct status code.
 *
 * Usage:
 *   try { await assertLessonAccess(userId, lessonId); }
 *   catch (e) { return accessErrorResponse(e); }
 */
export function accessErrorResponse(err: unknown): { status: number; body: { error: string } } {
  const msg = err instanceof Error ? err.message : String(err);
  switch (msg) {
    case 'ACCESS_DENIED':
      return { status: 403, body: { error: 'Module is locked. Complete prior modules first.' } };
    case 'LESSON_NOT_FOUND':
      return { status: 404, body: { error: 'Lesson not found.' } };
    case 'DB_UNAVAILABLE':
      return { status: 503, body: { error: 'Service temporarily unavailable.' } };
    default:
      return { status: 500, body: { error: 'Access check failed.' } };
  }
}
