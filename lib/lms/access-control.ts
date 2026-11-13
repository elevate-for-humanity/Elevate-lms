import 'server-only';
/**
 * LMS access control — server-side enforcement only.
 *
 * Every lesson and module fetch MUST call assertLessonAccess or
 * assertModuleAccess before returning data to the client.
 * No client-side gating is sufficient on its own.
 *
 * Throws on denial — callers must not catch and continue.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { canonicalBeautyApprenticeshipSlug, loadBeautyPaymentGate } from '@/lib/apprenticeship/beauty-payment-gate.mjs';

/**
 * Check the same prepayment barrier at the canonical module/lesson API boundary,
 * not just in React pages. The verified enrollment exception preserves existing
 * active apprentices and their payment plans.
 */
async function assertBeautyPaymentAccess(db: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>, userId: string, courseId: string) {
  const { data: course, error: courseError } = await db.from('courses')
    .select('slug').eq('id', courseId).maybeSingle();
  if (courseError) throw courseError;
  const slug = canonicalBeautyApprenticeshipSlug(course?.slug);
  if (!slug) return;
  const { data: profile, error: profileError } = await db.from('profiles')
    .select('email').eq('id', userId).maybeSingle();
  if (profileError) throw profileError;
  const paymentGate = await loadBeautyPaymentGate(db, userId, profile?.email, slug);
  if (paymentGate?.locked) throw new Error('ACCESS_DENIED');
}

/**
 * Asserts the user can access a lesson.
 * Resolves the lesson's module, then calls check_module_unlock() in the DB.
 *
 * Throws 'ACCESS_DENIED' if the module is locked.
 * Throws 'LESSON_NOT_FOUND' if the lesson does not exist.
 * Throws the raw DB error on infrastructure failure.
 */
export async function assertLessonAccess(userId: string, lessonId: string): Promise<void> {
  const db = await requireAdminClient();
  if (!db) throw new Error('DB_UNAVAILABLE');

  const { data: lesson, error: lookupError } = await db.from('course_lessons')
    .select('course_id').eq('id', lessonId).maybeSingle();
  if (lookupError) throw lookupError;
  if (!lesson?.course_id) throw new Error('LESSON_NOT_FOUND');
  await assertBeautyPaymentAccess(db, userId, lesson.course_id);

  const { data, error } = await db.rpc('can_access_lesson', {
    p_user_id: userId,
    p_lesson_id: lessonId,
  });

  if (error) throw error;
  if (data === null) throw new Error('LESSON_NOT_FOUND');
  if (data !== true) throw new Error('ACCESS_DENIED');
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
  const db = await requireAdminClient();
  if (!db) throw new Error('DB_UNAVAILABLE');

  await assertBeautyPaymentAccess(db, userId, courseId);
  const { data, error } = await db.rpc('check_module_unlock', {
    p_user_id: userId,
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
