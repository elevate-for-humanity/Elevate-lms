// Certification readiness check.
//
// Verifies a learner has met all requirements before the pipeline
// initiates a Stripe charge and sends the authorization email.
//
// Requirements checked:
//   1. Active enrollment exists and is completed
//   2. All curriculum lessons marked complete
//   3. All quiz lessons passed (score recorded)
//   4. Practical/lab lessons complete (for programs that require them)

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { ReadinessResult } from './types';

export async function checkCertificationReadiness(
  userId: string,
  programId: string
): Promise<ReadinessResult> {
  const db = createAdminClient();
  if (!db) {
    logger.error('[ExamAuth] Admin client unavailable for readiness check');
    return {
      eligible: false,
      missing: ['System error — contact support'],
      progress: { lessonsComplete: 0, lessonsTotal: 0, quizzesPassed: 0, quizzesTotal: 0, practicalComplete: false },
    };
  }

  const missing: string[] = [];

  // ── 1. Enrollment must be completed ────────────────────────────────────────
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .in('status', ['completed', 'active'])
    .maybeSingle();

  if (!enrollment) {
    return {
      eligible: false,
      missing: ['No active enrollment found for this program'],
      progress: { lessonsComplete: 0, lessonsTotal: 0, quizzesPassed: 0, quizzesTotal: 0, practicalComplete: false },
    };
  }

  if (enrollment.status !== 'completed') {
    missing.push('Program enrollment not yet marked complete');
  }

  // ── 2. Lesson completion ────────────────────────────────────────────────────
  // course_lessons is the canonical table — lms_lessons view reads from here.
  const { data: lessons } = await db
    .from('course_lessons')
    .select('id, lesson_type, title')
    .eq('course_id', programId)
    .eq('is_published', true);

  const totalLessons = lessons?.length ?? 0;

  // lesson_progress is the canonical completion table (written by recordStepCompletion)
  const { data: completions } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', (lessons ?? []).map((l) => l.id));

  const completedIds = new Set((completions ?? []).map((c) => c.lesson_id));
  const lessonsComplete = completedIds.size;

  if (lessonsComplete < totalLessons) {
    missing.push(`${totalLessons - lessonsComplete} lesson(s) not yet complete`);
  }

  // ── 3. Quiz passage ─────────────────────────────────────────────────────────
  // quiz_attempts.quiz_id stores the lesson UUID (used as quiz identity)
  const quizLessons = (lessons ?? []).filter((l) => l.content_type === 'quiz');
  const totalQuizzes = quizLessons.length;

  const { data: quizResults } = await db
    .from('quiz_attempts')
    .select('quiz_id, passed')
    .eq('user_id', userId)
    .in('quiz_id', quizLessons.map((l) => l.id))
    .eq('passed', true);

  const passedQuizIds = new Set((quizResults ?? []).map((r) => r.quiz_id));
  const quizzesPassed = passedQuizIds.size;

  if (quizzesPassed < totalQuizzes) {
    missing.push(`${totalQuizzes - quizzesPassed} quiz(zes) not yet passed`);
  }

  // ── 4. Practical/lab completion ─────────────────────────────────────────────
  const labLessons = (lessons ?? []).filter((l) => l.content_type === 'lab');
  const labsComplete = labLessons.every((l) => completedIds.has(l.id));
  const practicalComplete = labLessons.length === 0 || labsComplete;

  if (!practicalComplete) {
    missing.push('Practical/lab sessions not yet complete');
  }

  return {
    eligible: missing.length === 0,
    missing,
    progress: {
      lessonsComplete,
      lessonsTotal: totalLessons,
      quizzesPassed,
      quizzesTotal: totalQuizzes,
      practicalComplete,
    },
  };
}
