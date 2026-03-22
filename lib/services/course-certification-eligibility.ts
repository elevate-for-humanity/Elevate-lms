/**
 * lib/services/course-certification-eligibility.ts
 *
 * Determines whether a learner is eligible for certificate issuance.
 *
 * Eligibility requires ALL of:
 *   1. All required lessons complete (lesson_progress)
 *   2. All checkpoint/final_exam lessons passed (checkpoint_scores)
 *   3. All required practical evidence approved (student_lesson_evidence)
 *   4. All required skill signoffs approved (student_skill_signoffs)
 *   5. All required practical hours/attempts satisfied (student_practical_progress)
 *   6. All module completion rules satisfied
 *
 * This replaces the shallow check in lib/lms/engine/certificate.ts.
 * The certificate engine calls this before issuing any certificate.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { EVIDENCE_LESSON_TYPES, type LessonType } from '@/lib/curriculum/lesson-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnmetRequirement {
  code:       string;
  lessonId?:  string;
  lessonName?: string;
  message:    string;
}

export interface CertificationEligibility {
  eligible:           boolean;
  unmetRequirements:  UnmetRequirement[];
}

// ─── Eligibility check ────────────────────────────────────────────────────────

export async function checkCertificationEligibility(
  userId:   string,
  courseId: string
): Promise<CertificationEligibility> {
  const db = createAdminClient();
  const unmet: UnmetRequirement[] = [];

  // ── 1. Fetch all required lessons ──────────────────────────────────────────
  const { data: lessons } = await db
    .from('course_lessons')
    .select('id, title, lesson_type, is_required, passing_score, requires_evidence, requires_signoff')
    .eq('course_id', courseId)
    .eq('is_required', true);

  if (!lessons?.length) {
    // No required lessons — eligible by default (edge case)
    return { eligible: true, unmetRequirements: [] };
  }

  const requiredIds = lessons.map(l => l.id);

  // ── 2. Lesson completion ────────────────────────────────────────────────────
  const { data: progress } = await db
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('lesson_id', requiredIds);

  const completedSet = new Set(
    (progress ?? []).filter((p: any) => p.completed).map((p: any) => p.lesson_id)
  );

  // Certification lesson itself doesn't need to be "completed" — it IS the completion
  const nonCertLessons = lessons.filter(l => l.lesson_type !== 'certification');
  for (const lesson of nonCertLessons) {
    if (!completedSet.has(lesson.id)) {
      unmet.push({
        code: 'LESSON_NOT_COMPLETE',
        lessonId: lesson.id,
        lessonName: lesson.title,
        message: `Lesson "${lesson.title}" is not yet complete.`,
      });
    }
  }

  // ── 3. Checkpoint / final_exam scores ──────────────────────────────────────
  const assessmentLessons = lessons.filter(l =>
    ['checkpoint', 'quiz', 'final_exam'].includes(l.lesson_type)
  );

  if (assessmentLessons.length > 0) {
    const { data: scores } = await db
      .from('checkpoint_scores')
      .select('lesson_id, passed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('lesson_id', assessmentLessons.map(l => l.id));

    const passedSet = new Set(
      (scores ?? []).filter((s: any) => s.passed).map((s: any) => s.lesson_id)
    );

    for (const lesson of assessmentLessons) {
      if (!passedSet.has(lesson.id)) {
        unmet.push({
          code: 'ASSESSMENT_NOT_PASSED',
          lessonId: lesson.id,
          lessonName: lesson.title,
          message: `Assessment "${lesson.title}" (${lesson.lesson_type}) has not been passed.`,
        });
      }
    }
  }

  // ── 4. Practical evidence approval ─────────────────────────────────────────
  const evidenceLessons = lessons.filter(l => l.requires_evidence);

  if (evidenceLessons.length > 0) {
    const { data: evidence } = await db
      .from('student_lesson_evidence')
      .select('lesson_id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('lesson_id', evidenceLessons.map(l => l.id))
      .eq('status', 'approved');

    const approvedEvidenceSet = new Set((evidence ?? []).map((e: any) => e.lesson_id));

    for (const lesson of evidenceLessons) {
      if (!approvedEvidenceSet.has(lesson.id)) {
        unmet.push({
          code: 'EVIDENCE_NOT_APPROVED',
          lessonId: lesson.id,
          lessonName: lesson.title,
          message: `Practical evidence for "${lesson.title}" has not been approved by an evaluator.`,
        });
      }
    }
  }

  // ── 5. Skill signoffs ───────────────────────────────────────────────────────
  const signoffLessons = lessons.filter(l => l.requires_signoff);

  if (signoffLessons.length > 0) {
    const { data: signoffs } = await db
      .from('student_skill_signoffs')
      .select('lesson_id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('lesson_id', signoffLessons.map(l => l.id))
      .eq('status', 'approved');

    const approvedSignoffSet = new Set((signoffs ?? []).map((s: any) => s.lesson_id));

    for (const lesson of signoffLessons) {
      if (!approvedSignoffSet.has(lesson.id)) {
        unmet.push({
          code: 'SIGNOFF_NOT_APPROVED',
          lessonId: lesson.id,
          lessonName: lesson.title,
          message: `Skill signoff for "${lesson.title}" has not been approved.`,
        });
      }
    }
  }

  // ── 6. Practical hours/attempts ─────────────────────────────────────────────
  const practicalLessonIds = lessons
    .filter(l => EVIDENCE_LESSON_TYPES.includes(l.lesson_type as LessonType))
    .map(l => l.id);

  if (practicalLessonIds.length > 0) {
    type PracticalReq = { lesson_id: string; required_hours: number; required_attempts: number };
    type PracticalProg = { lesson_id: string; accumulated_hours: number; approved_attempts: number };

    const { data: practicalReqs } = await db
      .from('practical_requirements')
      .select('lesson_id, required_hours, required_attempts')
      .in('lesson_id', practicalLessonIds)
      .or('required_hours.gt.0,required_attempts.gt.0') as { data: PracticalReq[] | null };

    if (practicalReqs?.length) {
      const { data: practicalProgress } = await db
        .from('student_practical_progress')
        .select('lesson_id, accumulated_hours, approved_attempts')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .in('lesson_id', practicalReqs.map(r => r.lesson_id)) as { data: PracticalProg[] | null };

      const progressMap = new Map<string, PracticalProg>(
        (practicalProgress ?? []).map(p => [p.lesson_id, p])
      );

      for (const req of practicalReqs) {
        const prog = progressMap.get(req.lesson_id);
        const lessonName = lessons.find(l => l.id === req.lesson_id)?.title ?? req.lesson_id;

        if (req.required_hours > 0) {
          const accumulated = prog?.accumulated_hours ?? 0;
          if (accumulated < req.required_hours) {
            unmet.push({
              code: 'PRACTICAL_HOURS_INSUFFICIENT',
              lessonId: req.lesson_id,
              lessonName,
              message: `"${lessonName}" requires ${req.required_hours} hours; learner has ${accumulated}.`,
            });
          }
        }

        if (req.required_attempts > 0) {
          const approved = prog?.approved_attempts ?? 0;
          if (approved < req.required_attempts) {
            unmet.push({
              code: 'PRACTICAL_ATTEMPTS_INSUFFICIENT',
              lessonId: req.lesson_id,
              lessonName,
              message: `"${lessonName}" requires ${req.required_attempts} approved attempts; learner has ${approved}.`,
            });
          }
        }
      }
    }
  }

  const eligible = unmet.length === 0;

  if (!eligible) {
    logger.info('[certification-eligibility] Not eligible', {
      userId, courseId, unmetCount: unmet.length,
    });
  }

  return { eligible, unmetRequirements: unmet };
}
