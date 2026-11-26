/**
 * lib/lms/lesson-requirements.ts
 *
 * No-skip gate for lesson completion: a lesson whose required assignments
 * (rows in the assignments table linked to the lesson — authored in the
 * Course Builder and persisted at publish, see
 * lib/course-builder/publish-standard.ts) have not been submitted by the
 * learner cannot be marked complete.
 *
 * FAILS SAFE, by design (Elizabeth's rule): a lesson with NO required
 * assignments completes normally, and if the required-work data is missing
 * or unreadable for any reason, the lesson completes too — the learner is
 * never blocked by a data problem. Instead, the block is handed to PARIS
 * through the platform's existing repair path (enqueueParisRepair →
 * paris_code_repairs) so the root cause gets fixed. The student's request
 * never waits on that repair: reporting is fire-and-forget and fully
 * failure-isolated.
 */
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';

export interface RequiredWorkResult {
  allowed: boolean;
  /** Required assignments the learner has not submitted yet (only when readable). */
  missing: Array<{ id: string; title: string }>;
  /** True when the check could not be performed and the lesson was allowed through. */
  failedOpen: boolean;
}

/**
 * Hand a course-system block to PARIS as a repair item. Uses the PARIS
 * autopilot policy actor (the same owner the autopilot tick runs under).
 * Never throws and never blocks the caller.
 */
export async function reportCourseBlockToParis(input: {
  db: SupabaseClient;
  fingerprint: string;
  goal: string;
  candidate: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data: policy } = await input.db
      .from('paris_autopilot_policy')
      .select('actor_id')
      .eq('id', true)
      .maybeSingle();
    const actorId = (policy as { actor_id?: string } | null)?.actor_id;
    if (!actorId) {
      logger.warn('[lesson-requirements] No PARIS autopilot actor; block logged only', {
        fingerprint: input.fingerprint,
      });
      return;
    }
    const { enqueueParisRepair } = await import('@/lib/ai/runtime/code-repair');
    await enqueueParisRepair({
      actorId,
      goal: input.goal,
      fingerprint: input.fingerprint,
      candidate: input.candidate,
    });
  } catch (error) {
    logger.warn('[lesson-requirements] Could not hand block to PARIS', {
      fingerprint: input.fingerprint,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function checkRequiredLessonWork(
  db: SupabaseClient,
  input: { userId: string; lessonId: string; courseId: string },
): Promise<RequiredWorkResult> {
  try {
    const { data: assignments, error } = await db
      .from('assignments')
      .select('id,title')
      .eq('lesson_id', input.lessonId);
    if (error) throw error;
    if (!assignments || assignments.length === 0) {
      return { allowed: true, missing: [], failedOpen: false };
    }

    const assignmentIds = assignments.map((assignment: any) => assignment.id);
    const { data: submissions, error: submissionError } = await db
      .from('assignment_submissions')
      .select('assignment_id,submitted_at')
      .in('assignment_id', assignmentIds)
      .or(`user_id.eq.${input.userId},student_id.eq.${input.userId}`);
    if (submissionError) throw submissionError;

    const submitted = new Set(
      (submissions ?? [])
        .filter((row: any) => row.submitted_at != null)
        .map((row: any) => row.assignment_id),
    );
    const missing = assignments
      .filter((assignment: any) => !submitted.has(assignment.id))
      .map((assignment: any) => ({ id: assignment.id, title: assignment.title }));

    return { allowed: missing.length === 0, missing, failedOpen: false };
  } catch (error) {
    // Fail open for the student; surface the data problem to PARIS/staff.
    logger.warn('[lesson-requirements] Required-work check failed open', {
      lessonId: input.lessonId,
      courseId: input.courseId,
      userId: input.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    void reportCourseBlockToParis({
      db,
      fingerprint: `lesson-block:${input.lessonId}:required-work-data`,
      goal:
        `LMS no-skip gate could not read required-work data for lesson ${input.lessonId} ` +
        `(course ${input.courseId}) and failed open for the learner. Investigate why the ` +
        `assignments / assignment_submissions read failed so the gate can enforce again: ` +
        `${error instanceof Error ? error.message : String(error)}`,
      candidate: {
        kind: 'lesson_required_work_unreadable',
        lessonId: input.lessonId,
        courseId: input.courseId,
      },
    });
    return { allowed: true, missing: [], failedOpen: true };
  }
}
