/**
 * Competency gate — single source of truth.
 *
 * Determines whether a learner has all required instructor sign-offs
 * for a practical lesson before it can be marked complete.
 *
 * Usage:
 *   const gate = await checkCompetencyGate(db, { userId, lessonId });
 *   if (!gate.allowed) return 403 with gate.missingKeys
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface CompetencyCheck {
  key: string;
  requiresInstructorSignoff?: boolean;
}

export interface CompetencyGateResult {
  /** True when the learner may proceed to completion. */
  allowed: boolean;
  /** Keys of competency checks that still need instructor approval. Empty when allowed. */
  missingKeys: string[];
  /**
   * True when the lesson has practical_required=true.
   * False means the gate was not applicable — lesson has no sign-off requirement.
   */
  applicable: boolean;
}

/**
 * Check whether all required competency sign-offs exist for a learner + lesson.
 *
 * @param db   Admin Supabase client (service role — bypasses RLS for cross-user reads)
 * @param opts userId and lessonId (= course_lessons.id = course_lesson_id on step_submissions)
 */
export async function checkCompetencyGate(
  db: SupabaseClient,
  { userId, lessonId }: { userId: string; lessonId: string },
): Promise<CompetencyGateResult> {
  // Load lesson metadata
  const { data: lesson, error: lessonErr } = await db
    .from('course_lessons')
    .select('practical_required, competency_checks')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonErr) {
    // Surface real DB errors — do not swallow them
    logger.error('[competency-gate] Failed to load lesson metadata', { lessonId, error: lessonErr.message });
    throw new Error(`Failed to load lesson for competency gate: ${lessonErr.message}`);
  }

  // Lesson not found or no practical requirement — gate not applicable
  if (!lesson || !lesson.practical_required) {
    return { allowed: true, missingKeys: [], applicable: false };
  }

  const checks: CompetencyCheck[] = Array.isArray(lesson.competency_checks)
    ? (lesson.competency_checks as CompetencyCheck[])
    : [];

  const requiredKeys = checks
    .filter(c => c.requiresInstructorSignoff)
    .map(c => c.key);

  // No sign-off checks defined — practical flag set but no checks configured yet
  if (requiredKeys.length === 0) {
    return { allowed: true, missingKeys: [], applicable: true };
  }

  // Query approved submissions for this learner + lesson + required keys
  const { data: approved, error: subErr } = await db
    .from('step_submissions')
    .select('competency_key')
    .eq('user_id', userId)
    .eq('course_lesson_id', lessonId)
    .eq('status', 'approved')
    .in('competency_key', requiredKeys);

  if (subErr) {
    logger.error('[competency-gate] Failed to query step_submissions', { lessonId, userId, error: subErr.message });
    throw new Error(`Failed to query competency submissions: ${subErr.message}`);
  }

  const approvedKeys = new Set((approved ?? []).map(s => s.competency_key));
  const missingKeys = requiredKeys.filter(k => !approvedKeys.has(k));

  return {
    allowed: missingKeys.length === 0,
    missingKeys,
    applicable: true,
  };
}
