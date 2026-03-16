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
  // Get all lessons for this program via training_course → curriculum_lessons
  const { data: lessons } = await db
    .from('curriculum_lessons')
    .select('id, content_type, title')
    .eq('program_id', programId)
    .eq('is_published', true);

  const totalLessons = lessons?.length ?? 0;

  const { data: completions } = await db
    .from('lesson_completions')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', (lessons ?? []).map((l) => l.id));

  const completedIds = new Set((completions ?? []).map((c) => c.lesson_id));
  const lessonsComplete = completedIds.size;

  if (lessonsComplete < totalLessons) {
    missing.push(`${totalLessons - lessonsComplete} lesson(s) not yet complete`);
  }

  // ── 3. Quiz passage ─────────────────────────────────────────────────────────
  const quizLessons = (lessons ?? []).filter((l) => l.content_type === 'quiz');
  const totalQuizzes = quizLessons.length;

  const { data: quizResults } = await db
    .from('curriculum_quiz_attempts')
    .select('lesson_id, passed')
    .eq('user_id', userId)
    .in('lesson_id', quizLessons.map((l) => l.id))
    .eq('passed', true);

  const passedQuizIds = new Set((quizResults ?? []).map((r) => r.lesson_id));
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
