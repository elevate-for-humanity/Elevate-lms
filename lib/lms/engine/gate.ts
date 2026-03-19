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

  // Fetch the target lesson and its module — canonical tables
  const { data: targetLesson, error: lessonErr } = await db
    .from('course_lessons')
    .select('id, title, lesson_type, module_id, course_modules(id, order_index)')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (lessonErr || !targetLesson) {
    // Lesson not found in course_lessons — skip gate
    return;
  }

  const moduleOrder = (targetLesson as any).course_modules?.order_index ?? 0;

  // First module has no prior checkpoint to pass
  if (moduleOrder <= 1) {
    return;
  }

  const prevModuleOrder = moduleOrder - 1;

  // Find the checkpoint for the previous module via course_modules join
  const { data: prevModuleRow } = await db
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('order_index', prevModuleOrder)
    .maybeSingle();

  if (!prevModuleRow) return;

  // Find the checkpoint lesson in the previous module
  const { data: prevCheckpoint } = await db
    .from('course_lessons')
    .select('id, title, passing_score')
    .eq('course_id', courseId)
    .eq('module_id', prevModuleRow.id)
    .eq('lesson_type', 'checkpoint')
    .order('order_index', { ascending: false })
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
      message:            `You must pass "${prevCheckpoint.title}" (≥${prevCheckpoint.passing_score}%) before continuing.`,
      checkpointLessonId: prevCheckpoint.id,
      checkpointTitle:    prevCheckpoint.title,
      requiredScore:      prevCheckpoint.passing_score ?? 80,
      bestScore:          null,
    };
    throw err;
  }
}
