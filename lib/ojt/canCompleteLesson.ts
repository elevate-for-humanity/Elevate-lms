import { getAdminClient } from '@/lib/supabase/admin';
import { resolveLessonOjt } from '@/lib/ojt/resolveLessonOjt';

/**
 * Returns true if the user is allowed to mark this lesson complete.
 *
 * Theory/quiz/checkpoint/exam lessons: always allowed.
 * Lab lessons require all three gates to pass:
 *   1. Active shop placement exists (apprentice_placements or shop_placements)
 *   2. Required competency_log entries exist for the linked skill
 *   3. If requires_verification=true, those entries must be supervisor-verified
 */
export async function canCompleteLesson(userId: string, lessonId: string): Promise<boolean> {
  const db = await getAdminClient();

  const lesson = await resolveLessonOjt(db, lessonId);

  if (!lesson) return false;

  // Non-lab lessons always pass — no OJT requirement
  if (lesson.lesson_type !== 'lab' || !lesson.required_skill_id) return true;

  // Gate 1: active shop placement must exist.
  // Check apprentice_placements (canonical FK-based) first,
  // fall back to shop_placements (legacy text-based).
  const { data: canonicalPlacement } = await db
    .from('apprentice_placements')
    .select('id')
    .eq('student_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!canonicalPlacement) {
    // shop_placements fallback — only active during supervisor migration window.
    // Gated by SUPERVISOR_EMAIL_FALLBACK_ENABLED=true. Disabled by default.
    const emailFallbackEnabled = process.env.SUPERVISOR_EMAIL_FALLBACK_ENABLED === 'true';
    if (emailFallbackEnabled) {
      const { data: legacyPlacement } = await db
        .from('shop_placements')
        .select('id')
        .eq('student_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!legacyPlacement) return false; // NO_SHOP_PLACEMENT
    } else {
      return false; // NO_SHOP_PLACEMENT — fallback disabled
    }
  }

  // Gate 2 + 3: competency log reps
  const { data: logs } = await db
    .from('competency_log')
    .select('id, supervisor_verified, service_count')
    .eq('apprentice_id', userId)
    .eq('skill_id', lesson.required_skill_id);

  if (!logs || logs.length === 0) return false;

  const verifiedReps = logs
    .filter(l => l.supervisor_verified)
    .reduce((sum, l) => sum + (l.service_count ?? 1), 0);

  const totalReps = logs
    .reduce((sum, l) => sum + (l.service_count ?? 1), 0);

  if (lesson.requires_verification) {
    return verifiedReps >= lesson.required_reps;
  }

  return totalReps >= lesson.required_reps;
}
