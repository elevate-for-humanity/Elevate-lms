/**
 * lib/course-builder/competency-mapper.ts
 *
 * Maps competency keys to lessons and manages competency_results records.
 *
 * Responsibilities:
 *   - Attach competency keys from the registry to course lessons
 *   - Enforce the signoff-only rule: if requiresInstructorSignoff=true,
 *     the competency cannot be marked achieved by quiz alone
 *   - Create/update competency_results rows as learners progress
 *   - Validate that every critical competency appears in at least one lesson
 *     and at least one assessment or practical
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CourseTemplate, CourseLesson } from './schema';
import {
  COMPETENCY_REGISTRY,
  getCompetenciesForProgram,
  type CompetencyDefinition,
} from './competencies';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompetencyStatus = 'not_started' | 'in_progress' | 'achieved' | 'failed';
export type AchievedVia = 'quiz' | 'lab' | 'exam' | 'observation' | 'assignment';

export type CompetencyResultRow = {
  userId: string;
  courseId: string;
  competencyKey: string;
  status: CompetencyStatus;
  achievedAt?: string;
  achievedVia?: AchievedVia;
  verifiedBy?: string;
  lessonId?: string;
  evidenceSubmissionId?: string;
};

export type CompetencyCoverageReport = {
  programSlug: string;
  totalCompetencies: number;
  criticalCompetencies: number;
  covered: string[];
  uncovered: string[];
  criticalUncovered: string[];
  signoffOnlyViolations: string[];
  valid: boolean;
  errors: string[];
  warnings: string[];
};

// ─── Coverage validation ──────────────────────────────────────────────────────

/**
 * Validates that every registered competency for a program appears in at least
 * one lesson, and that signoff-only competencies are not quiz-only assessed.
 */
export function validateCompetencyCoverage(
  template: CourseTemplate,
): CompetencyCoverageReport {
  const programCompetencies = getCompetenciesForProgram(template.programSlug);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!programCompetencies.length) {
    return {
      programSlug: template.programSlug,
      totalCompetencies: 0,
      criticalCompetencies: 0,
      covered: [],
      uncovered: [],
      criticalUncovered: [],
      signoffOnlyViolations: [],
      valid: true,
      errors: [],
      warnings: [`No competencies registered for program '${template.programSlug}'`],
    };
  }

  const allLessons = template.modules.flatMap(m => m.lessons);

  // Build a map: competencyKey → lessons that reference it
  const keyToLessons = new Map<string, CourseLesson[]>();
  for (const lesson of allLessons) {
    for (const check of lesson.competencyChecks ?? []) {
      if (!keyToLessons.has(check.key)) keyToLessons.set(check.key, []);
      keyToLessons.get(check.key)!.push(lesson);
    }
  }

  const covered: string[] = [];
  const uncovered: string[] = [];
  const criticalUncovered: string[] = [];
  const signoffOnlyViolations: string[] = [];

  for (const comp of programCompetencies) {
    const lessons = keyToLessons.get(comp.key) ?? [];

    if (lessons.length === 0) {
      uncovered.push(comp.key);
      if (comp.isCritical) {
        criticalUncovered.push(comp.key);
        errors.push(`Critical competency '${comp.key}' (${comp.label}) is not covered by any lesson`);
      } else {
        warnings.push(`Competency '${comp.key}' (${comp.label}) is not covered by any lesson`);
      }
      continue;
    }

    covered.push(comp.key);

    // Signoff-only rule: if requiresInstructorSignoff=true, the competency
    // must appear in at least one lab/assignment lesson, not just quiz lessons
    if (comp.requiresInstructorSignoff) {
      const hasSignoffLesson = lessons.some(
        l => l.type === 'lab' || l.type === 'assignment',
      );
      if (!hasSignoffLesson) {
        signoffOnlyViolations.push(comp.key);
        errors.push(
          `Competency '${comp.key}' requires instructor signoff but only appears in non-practical lessons. ` +
          `Add it to a lab or assignment lesson.`,
        );
      }
    }
  }

  const criticalCompetencies = programCompetencies.filter(c => c.isCritical).length;

  return {
    programSlug: template.programSlug,
    totalCompetencies: programCompetencies.length,
    criticalCompetencies,
    covered,
    uncovered,
    criticalUncovered,
    signoffOnlyViolations,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Initialize competency_results for a new enrollment ──────────────────────

/**
 * Creates competency_results rows (status='not_started') for all registered
 * competencies when a learner enrolls in a course.
 * Idempotent — uses upsert with ignoreDuplicates.
 */
export async function initializeCompetencyResults(
  db: SupabaseClient,
  opts: { userId: string; courseId: string; programSlug: string },
): Promise<{ created: number; errors: string[] }> {
  const competencies = getCompetenciesForProgram(opts.programSlug);
  if (!competencies.length) return { created: 0, errors: [] };

  const rows = competencies.map(c => ({
    user_id:        opts.userId,
    course_id:      opts.courseId,
    competency_key: c.key,
    status:         'not_started' as CompetencyStatus,
  }));

  const { error } = await db
    .from('competency_results')
    .upsert(rows, { onConflict: 'user_id,course_id,competency_key', ignoreDuplicates: true });

  if (error) {
    logger.error('[competency-mapper] Failed to initialize competency_results', {
      userId: opts.userId,
      courseId: opts.courseId,
      error: error.message,
    });
    return { created: 0, errors: [error.message] };
  }

  return { created: rows.length, errors: [] };
}

// ─── Mark a competency achieved ───────────────────────────────────────────────

/**
 * Updates a competency_results row to 'achieved'.
 *
 * Enforces the signoff-only rule: if the competency requires instructor signoff,
 * achievedVia must be 'observation', 'lab', or 'assignment' — not 'quiz' or 'exam'.
 */
export async function markCompetencyAchieved(
  db: SupabaseClient,
  opts: {
    userId: string;
    courseId: string;
    competencyKey: string;
    achievedVia: AchievedVia;
    verifiedBy?: string;
    lessonId?: string;
    evidenceSubmissionId?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  // Look up the competency definition to enforce signoff-only rule
  const def = COMPETENCY_REGISTRY.find(c => c.key === opts.competencyKey);

  if (def?.requiresInstructorSignoff) {
    const quizOnlyMethods: AchievedVia[] = ['quiz', 'exam'];
    if (quizOnlyMethods.includes(opts.achievedVia)) {
      const msg = `Competency '${opts.competencyKey}' requires instructor signoff — cannot be achieved via '${opts.achievedVia}'`;
      logger.warn('[competency-mapper] Signoff-only violation blocked', {
        competencyKey: opts.competencyKey,
        achievedVia: opts.achievedVia,
        userId: opts.userId,
      });
      return { success: false, error: msg };
    }
    if (!opts.verifiedBy) {
      return {
        success: false,
        error: `Competency '${opts.competencyKey}' requires instructor signoff — verifiedBy must be set`,
      };
    }
  }

  const { error } = await db
    .from('competency_results')
    .upsert({
      user_id:                opts.userId,
      course_id:              opts.courseId,
      competency_key:         opts.competencyKey,
      status:                 'achieved',
      achieved_at:            new Date().toISOString(),
      achieved_via:           opts.achievedVia,
      verified_by:            opts.verifiedBy ?? null,
      lesson_id:              opts.lessonId ?? null,
      evidence_submission_id: opts.evidenceSubmissionId ?? null,
      updated_at:             new Date().toISOString(),
    }, { onConflict: 'user_id,course_id,competency_key' });

  if (error) {
    logger.error('[competency-mapper] Failed to mark competency achieved', {
      competencyKey: opts.competencyKey,
      userId: opts.userId,
      error: error.message,
    });
    return { success: false, error: error.message };
  }

  logger.info('[competency-mapper] Competency achieved', {
    competencyKey: opts.competencyKey,
    userId: opts.userId,
    achievedVia: opts.achievedVia,
  });

  return { success: true };
}

// ─── Get competency results for a learner ────────────────────────────────────

export type LearnerCompetencyStatus = {
  key: string;
  label: string;
  isCritical: boolean;
  requiresInstructorSignoff: boolean;
  status: CompetencyStatus;
  achievedAt?: string;
  achievedVia?: string;
};

export async function getLearnerCompetencyStatus(
  db: SupabaseClient,
  opts: { userId: string; courseId: string; programSlug: string },
): Promise<LearnerCompetencyStatus[]> {
  const programCompetencies = getCompetenciesForProgram(opts.programSlug);

  const { data: results } = await db
    .from('competency_results')
    .select('competency_key, status, achieved_at, achieved_via')
    .eq('user_id', opts.userId)
    .eq('course_id', opts.courseId);

  const resultMap = new Map(
    (results ?? []).map(r => [r.competency_key, r]),
  );

  return programCompetencies.map(comp => {
    const result = resultMap.get(comp.key);
    return {
      key: comp.key,
      label: comp.label,
      isCritical: comp.isCritical,
      requiresInstructorSignoff: comp.requiresInstructorSignoff,
      status: (result?.status as CompetencyStatus) ?? 'not_started',
      achievedAt: result?.achieved_at ?? undefined,
      achievedVia: result?.achieved_via ?? undefined,
    };
  });
}

// ─── Check if all critical competencies are achieved ─────────────────────────

export async function allCriticalCompetenciesAchieved(
  db: SupabaseClient,
  opts: { userId: string; courseId: string; programSlug: string },
): Promise<boolean> {
  const statuses = await getLearnerCompetencyStatus(db, opts);
  const critical = statuses.filter(s => s.isCritical);
  return critical.every(s => s.status === 'achieved');
}
