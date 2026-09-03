/**
 * Compatibility adapter for automatic program course creation.
 *
 * Course generation ownership lives in lib/course-factory. Keep this export only
 * so existing enrollment/program provisioning callers do not break while their
 * imports are migrated. Do not add generation logic here.
 */
import { courseFactory } from '@/lib/course-factory';

export type ProgramAutoCourseMode = 'replace' | 'missing-only' | 'refresh';
export type ProgramAutoCourseVideoMode = 'queue' | 'off';

export async function autoGenerateCourseForProgram(args: {
  programId: string;
  mode?: ProgramAutoCourseMode;
  videoMode?: ProgramAutoCourseVideoMode;
  videoQueueLimit?: number | null;
}) {
  const result = await courseFactory({
    programId: args.programId,
    mode: args.mode ?? 'refresh',
    contentSource: 'ai',
    videoMode: args.videoMode ?? 'queue',
    videoQueueLimit: args.videoQueueLimit ?? null,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status ?? 'incomplete',
      error: result.errors?.join('; ') || 'Canonical Course Factory failed',
      courseId: result.courseId,
      expectedLessonCount: result.expectedLessonCount,
      lessonCount: result.lessonCount,
      completionRatio: result.completionRatio,
      generationFailures: result.generationFailures ?? [],
      warnings: result.warnings ?? [],
    };
  }

  return {
    ok: true as const,
    status: 'generated' as const,
    courseId: result.courseId,
    moduleCount: result.moduleCount,
    lessonCount: result.lessonCount,
    expectedLessonCount: result.expectedLessonCount,
    completionRatio: result.completionRatio,
    warnings: result.warnings ?? [],
    videoQueue: {
      queued: result.videosQueued ?? 0,
    },
  };
}
