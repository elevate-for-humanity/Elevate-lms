/**
 * Completion rule evaluator.
 *
 * Reads completion_rules rows for a course or program and evaluates
 * whether the learner has satisfied them. Falls back to sensible
 * defaults when no rules are configured so existing courses keep
 * working without migration.
 *
 * Called by:
 *   - /api/courses/[courseId]/complete  (course completion check)
 *   - /api/lessons/[lessonId]/complete  (program completion check after course done)
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type EntityType = 'course' | 'program';

interface CompletionRule {
  rule_type: string;
  config: Record<string, unknown>;
}

interface CourseCompletionContext {
  totalLessons: number;
  completedLessons: number;
  requiredLessons: number;
  completedRequiredLessons: number;
  minScore?: number;
  achievedScore?: number;
}

interface ProgramCompletionContext {
  totalRequiredCourses: number;
  completedCourses: number;
}

/**
 * Evaluate whether a learner has completed a course.
 * Falls back to "all lessons complete" if no rules are configured.
 */
export async function evaluateCourseCompletion(
  courseId: string,
  context: CourseCompletionContext
): Promise<boolean> {
  const db = createAdminClient();
  const { data: rules } = await db
    .from('completion_rules')
    .select('rule_type, config')
    .eq('entity_type', 'course')
    .eq('entity_id', courseId)
    .eq('is_active', true);

  // Default: all lessons must be completed
  if (!rules || rules.length === 0) {
    return context.totalLessons > 0 &&
           context.completedLessons >= context.totalLessons;
  }

  return rules.every((rule: CompletionRule) => evaluateCourseRule(rule, context));
}

function evaluateCourseRule(
  rule: CompletionRule,
  ctx: CourseCompletionContext
): boolean {
  switch (rule.rule_type) {
    case 'all_lessons':
      return ctx.totalLessons > 0 && ctx.completedLessons >= ctx.totalLessons;

    case 'required_lessons':
      return ctx.requiredLessons > 0 &&
             ctx.completedRequiredLessons >= ctx.requiredLessons;

    case 'min_score': {
      const minScore = Number(rule.config.min_score ?? 70);
      return ctx.achievedScore !== undefined && ctx.achievedScore >= minScore;
    }

    default:
      // Unknown rule type — don't block completion
      return true;
  }
}

/**
 * Check whether completing a course triggers program completion.
 * Calls the check_program_completion DB function which reads
 * program_completion_candidates (all required courses done, program
 * not yet marked complete).
 *
 * Returns array of program enrollments that are now complete.
 * Empty array means no program was completed by this course.
 */
export async function checkProgramCompletion(
  userId: string,
  courseId: string
): Promise<Array<{ program_enrollment_id: string; program_id: string; user_id: string }>> {
  const db = createAdminClient();
  const { data, error } = await db.rpc('check_program_completion', {
    p_user_id:   userId,
    p_course_id: courseId,
  });

  if (error) {
    // Function may not exist yet in this environment — non-fatal
    return [];
  }

  return data ?? [];
}

/**
 * Mark a program enrollment as completed and issue the program credential.
 * Idempotent — safe to call multiple times.
 */
export async function completeProgramEnrollment(
  programEnrollmentId: string,
  userId: string,
  programId: string
): Promise<void> {
  const db = createAdminClient();

  // Mark program completed in DB
  await db.rpc('mark_program_completed', {
    p_program_enrollment_id: programEnrollmentId,
  });

  // Issue program-level credential certificate
  try {
    const { issueCertificate } = await import('@/lib/certificates/issue-certificate');

    // Fetch learner profile for certificate
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Fetch program name
    const { data: program } = await db
      .from('training_programs')
      .select('program_name, duration_hours')
      .eq('id', programId)
      .maybeSingle();

    await issueCertificate({
      supabase:      db,
      studentId:     userId,
      studentName:   profile?.full_name ?? 'Learner',
      studentEmail:  profile?.email,
      programId,
      programName:   program?.program_name,
      programHours:  program?.duration_hours ?? null,
      enrollmentId:  programEnrollmentId,
    });
  } catch {
    // Certificate issuance failure is logged inside issueCertificate.
    // Do not re-throw — program completion is already recorded.
  }
}
