/**
 * lib/lms/progression-gate.ts
 *
 * Unlock rule engine for lesson and module progression.
 *
 * Reads course_lessons.unlock_rule (JSONB) and evaluates whether a learner
 * satisfies the rule before accessing a lesson.
 *
 * Rule types (spec §12):
 *   pass_assessment        — learner must have passed a quiz/checkpoint with minimumScore
 *   approved_submission    — learner must have an approved step_submission for this lesson
 *   complete_previous_module — all required lessons in the previous module must be complete
 *   achieve_competency     — learner must have achieved a specific competency_key
 *
 * Usage:
 *   const gate = await evaluateUnlockRule(db, { userId, lessonId });
 *   if (!gate.unlocked) return 403 with gate.reason
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UnlockRule } from '@/lib/course-builder/schema';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GateResult = {
  unlocked: boolean;
  reason?: string;
  ruleType?: UnlockRule['type'];
};

// ─── Rule evaluators ──────────────────────────────────────────────────────────

async function evalPassAssessment(
  db: SupabaseClient,
  userId: string,
  lessonId: string,
  rule: Extract<UnlockRule, { type: 'pass_assessment' }>,
): Promise<GateResult> {
  const { data, error } = await db
    .from('checkpoint_scores')
    .select('score, passed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`progression-gate: checkpoint_scores query failed: ${error.message}`);

  if (!data) {
    return { unlocked: false, reason: 'Assessment not yet attempted', ruleType: 'pass_assessment' };
  }
  if (data.score < rule.minimumScore) {
    return {
      unlocked: false,
      reason: `Assessment score ${data.score} is below required ${rule.minimumScore}`,
      ruleType: 'pass_assessment',
    };
  }
  return { unlocked: true, ruleType: 'pass_assessment' };
}

async function evalApprovedSubmission(
  db: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<GateResult> {
  const { data, error } = await db
    .from('step_submissions')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_lesson_id', lessonId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`progression-gate: step_submissions query failed: ${error.message}`);

  if (!data) {
    return {
      unlocked: false,
      reason: 'No approved submission found for this lesson',
      ruleType: 'approved_submission',
    };
  }
  return { unlocked: true, ruleType: 'approved_submission' };
}

async function evalCompletePreviousModule(
  db: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<GateResult> {
  // Find the module this lesson belongs to, then find the previous module
  const { data: lesson, error: lessonErr } = await db
    .from('course_lessons')
    .select('course_module_id, order_index, course_id')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) {
    throw new Error(`progression-gate: lesson lookup failed: ${lessonErr?.message}`);
  }

  // Get the current module's order
  const { data: currentMod, error: modErr } = await db
    .from('course_modules')
    .select('order_index, course_id')
    .eq('id', lesson.course_module_id)
    .single();

  if (modErr || !currentMod) {
    throw new Error(`progression-gate: module lookup failed: ${modErr?.message}`);
  }

  if (currentMod.order_index <= 1) {
    // First module — no previous module to complete
    return { unlocked: true, ruleType: 'complete_previous_module' };
  }

  // Find the previous module
  const { data: prevMod, error: prevErr } = await db
    .from('course_modules')
    .select('id')
    .eq('course_id', currentMod.course_id)
    .eq('order_index', currentMod.order_index - 1)
    .single();

  if (prevErr || !prevMod) {
    // No previous module found — allow access
    return { unlocked: true, ruleType: 'complete_previous_module' };
  }

  // Check all required lessons in the previous module are complete
  const { data: prevLessons, error: prevLessonsErr } = await db
    .from('course_lessons')
    .select('id, is_required')
    .eq('course_module_id', prevMod.id)
    .eq('is_required', true);

  if (prevLessonsErr) {
    throw new Error(`progression-gate: previous module lessons query failed: ${prevLessonsErr.message}`);
  }

  if (!prevLessons?.length) {
    return { unlocked: true, ruleType: 'complete_previous_module' };
  }

  const prevLessonIds = prevLessons.map(l => l.id);

  const { data: completed, error: progressErr } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', prevLessonIds);

  if (progressErr) {
    throw new Error(`progression-gate: lesson_progress query failed: ${progressErr.message}`);
  }

  const completedIds = new Set((completed ?? []).map(r => r.lesson_id));
  const incomplete = prevLessonIds.filter(id => !completedIds.has(id));

  if (incomplete.length > 0) {
    return {
      unlocked: false,
      reason: `Previous module has ${incomplete.length} incomplete required lesson(s)`,
      ruleType: 'complete_previous_module',
    };
  }

  return { unlocked: true, ruleType: 'complete_previous_module' };
}

async function evalAchieveCompetency(
  db: SupabaseClient,
  userId: string,
  lessonId: string,
  rule: Extract<UnlockRule, { type: 'achieve_competency' }>,
): Promise<GateResult> {
  // Get course_id from the lesson
  const { data: lesson, error: lessonErr } = await db
    .from('course_lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) {
    throw new Error(`progression-gate: lesson lookup failed: ${lessonErr?.message}`);
  }

  const { data: result, error } = await db
    .from('competency_results')
    .select('status')
    .eq('user_id', userId)
    .eq('course_id', lesson.course_id)
    .eq('competency_key', rule.competencyKey)
    .maybeSingle();

  if (error) throw new Error(`progression-gate: competency_results query failed: ${error.message}`);

  if (!result || result.status !== 'achieved') {
    return {
      unlocked: false,
      reason: `Competency '${rule.competencyKey}' has not been achieved`,
      ruleType: 'achieve_competency',
    };
  }

  return { unlocked: true, ruleType: 'achieve_competency' };
}

// ─── Main gate evaluator ──────────────────────────────────────────────────────

/**
 * Evaluates the unlock_rule on a lesson for a given learner.
 * Returns { unlocked: true } when no rule is set (open access).
 */
export async function evaluateUnlockRule(
  db: SupabaseClient,
  { userId, lessonId }: { userId: string; lessonId: string },
): Promise<GateResult> {
  const { data: lesson, error } = await db
    .from('course_lessons')
    .select('unlock_rule')
    .eq('id', lessonId)
    .maybeSingle();

  if (error) {
    logger.error('[progression-gate] Failed to load lesson unlock_rule', { lessonId, error: error.message });
    throw new Error(`Failed to load lesson for progression gate: ${error.message}`);
  }

  if (!lesson || !lesson.unlock_rule) {
    return { unlocked: true };
  }

  const rule = lesson.unlock_rule as UnlockRule;

  try {
    switch (rule.type) {
      case 'pass_assessment':
        return evalPassAssessment(db, userId, lessonId, rule);
      case 'approved_submission':
        return evalApprovedSubmission(db, userId, lessonId);
      case 'complete_previous_module':
        return evalCompletePreviousModule(db, userId, lessonId);
      case 'achieve_competency':
        return evalAchieveCompetency(db, userId, lessonId, rule);
      default:
        logger.warn('[progression-gate] Unknown rule type', { rule, lessonId });
        return { unlocked: true };
    }
  } catch (err) {
    logger.error('[progression-gate] Rule evaluation error', { lessonId, userId, err });
    throw err;
  }
}

// ─── Batch gate check (for module accordion rendering) ───────────────────────

export type LessonAccessMap = Record<string, GateResult>;

/**
 * Evaluates unlock rules for all lessons in a list.
 * Used by the course page to render locked/unlocked state without N+1 queries.
 */
export async function batchEvaluateUnlockRules(
  db: SupabaseClient,
  userId: string,
  lessonIds: string[],
): Promise<LessonAccessMap> {
  if (!lessonIds.length) return {};

  // Load all unlock rules in one query
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id, unlock_rule')
    .in('id', lessonIds);

  if (error) throw new Error(`batch gate: lesson query failed: ${error.message}`);

  const results: LessonAccessMap = {};

  await Promise.all(
    (lessons ?? []).map(async lesson => {
      if (!lesson.unlock_rule) {
        results[lesson.id] = { unlocked: true };
        return;
      }
      try {
        results[lesson.id] = await evaluateUnlockRule(db, { userId, lessonId: lesson.id });
      } catch {
        // On error, default to locked for safety
        results[lesson.id] = { unlocked: false, reason: 'Gate evaluation error' };
      }
    }),
  );

  return results;
}
