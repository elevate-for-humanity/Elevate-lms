/**
 * enforceCheckpointGate
 *
 * Server-side enforcement of the checkpoint progression rule.
 * Called from the lesson completion API before writing lesson_progress.
 *
 * Rule: a learner cannot complete a lesson in module N if the checkpoint
 * for module N-1 has not been passed (score >= passing_score).
 *
 * This is the API-layer twin of canAccessLesson (which is pure/client-safe).
 * Both must agree — this one writes nothing and throws on violation.
 *
 * Returns void if the gate is clear.
 * Throws { code: 'CHECKPOINT_NOT_PASSED', message, checkpointId } if blocked.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface CheckpointGateError {
  code: 'CHECKPOINT_NOT_PASSED';
  message: string;
  checkpointLessonId: string;
  checkpointTitle: string;
  requiredScore: number;
  bestScore: number | null;
}

/**
 * isCheckpointGateError
 *
 * Returns true if the thrown value is either:
 *   - A CheckpointGateError from the application-layer gate, or
 *   - A raw PostgreSQL 23514 error from the DB-layer trigger.
 *
 * Use this in catch blocks on lesson_progress write paths that use
 * createAdminClient() and do not call enforceCheckpointGate() first.
 */
export function isCheckpointGateError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    (err as CheckpointGateError).code === 'CHECKPOINT_NOT_PASSED' ||
    msg.includes('Checkpoint gate blocked') ||
    msg.includes('23514')
  );
}

/**
 * checkpointGateResponse
 *
 * Returns a normalized NextResponse for checkpoint gate violations.
 * Use in API route catch blocks after isCheckpointGateError().
 */
export function checkpointGateResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'You must pass the required checkpoint before continuing.',
      code:  'CHECKPOINT_NOT_PASSED',
    },
    { status: 403 }
  );
}

export async function enforceCheckpointGate(
  userId: string,
  lessonId: string,
  courseId: string
): Promise<void> {
  const db = createAdminClient();

  // Fetch the target lesson's module_order
  const { data: targetLesson, error: lessonErr } = await db
    .from('curriculum_lessons')
    .select('module_order, lesson_order, lesson_title, step_type')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (lessonErr || !targetLesson) {
    // Not a curriculum_lessons row (e.g. legacy training_lessons) — skip gate
    return;
  }

  // First module has no prior checkpoint to pass
  if (targetLesson.module_order <= 1) {
    return;
  }

  const prevModuleOrder = targetLesson.module_order - 1;

  // Find the checkpoint for the previous module
  const { data: prevCheckpoint } = await db
    .from('curriculum_lessons')
    .select('id, lesson_title, passing_score')
    .eq('course_id', courseId)
    .eq('module_order', prevModuleOrder)
    .eq('step_type', 'checkpoint')
    .order('lesson_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prevCheckpoint) {
    // No checkpoint defined for previous module — gate is open
    return;
  }

  // Check best passing attempt for this checkpoint
  const { data: bestScore } = await db
    .from('checkpoint_scores')
    .select('score, passed')
    .eq('user_id', userId)
    .eq('lesson_id', prevCheckpoint.id)
    .eq('passed', true)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!bestScore) {
    const err: CheckpointGateError = {
      code:               'CHECKPOINT_NOT_PASSED',
      message:            `You must pass "${prevCheckpoint.lesson_title}" (≥${prevCheckpoint.passing_score}%) before continuing.`,
      checkpointLessonId: prevCheckpoint.id,
      checkpointTitle:    prevCheckpoint.lesson_title,
      requiredScore:      prevCheckpoint.passing_score ?? 80,
      bestScore:          null,
    };
    throw err;
  }
}
