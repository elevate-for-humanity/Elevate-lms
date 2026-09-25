import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getCourseMediaState } from '@/lib/course-factory/media-manager';
import { evaluatePersistedCredentialCourse } from '@/lib/course-factory/canonical-course-gate';


async function ensureModuleProgressionRules(db: SupabaseClient, courseId: string) {
  const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] =
    await Promise.all([
      db
        .from('course_modules')
        .select('id,order_index')
        .eq('course_id', courseId)
        .order('order_index'),
      db
        .from('course_lessons')
        .select('id,module_id,lesson_type,passing_score,order_index')
        .eq('course_id', courseId)
        .order('order_index'),
    ]);
  if (moduleError) throw moduleError;
  if (lessonError) throw lessonError;

  const orderedModules = modules ?? [];
  for (const [index, module] of orderedModules.entries()) {
    const checkpoint = (lessons ?? []).find(
      (lesson) =>
        lesson.module_id === module.id &&
        ['checkpoint', 'quiz', 'exam'].includes(String(lesson.lesson_type)),
    );
    const { error } = await db.from('module_completion_rules').upsert(
      {
        course_id: courseId,
        module_id: module.id,
        required_previous_module_id: index > 0 ? orderedModules[index - 1]?.id ?? null : null,
        required_checkpoint_lesson_id: checkpoint?.id ?? null,
        minimum_score: checkpoint?.id
          ? Math.max(1, Math.min(100, Number(checkpoint.passing_score ?? 80)))
          : null,
      },
      { onConflict: 'course_id,module_id' },
    );
    if (error) throw error;
  }
}

/** Course build completion is separate from publication. */
export async function markCourseMediaPendingWithClient(input: {
  db: SupabaseClient;
  courseId: string;
}) {
  const { error } = await input.db
    .from('courses')
    .update({
      generation_status: 'generating',
      generation_progress: 95,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.courseId)
    .neq('status', 'published');
  if (error) throw error;
  return { ok: true as const, state: 'media_pending' as const };
}

/**
 * Finalizes one unified build without publishing it. Human review remains the
 * only publication authority after every required video is attached and valid.
 */
export async function finalizeUnifiedCourseBuildWithClient(input: {
  db: SupabaseClient;
  courseId: string;
  verifyUrls?: boolean;
}) {
  await ensureModuleProgressionRules(input.db, input.courseId);
  const media = await getCourseMediaState(input.courseId, {
    verifyUrls: input.verifyUrls !== false,
  });
  if (!media.completePackage) {
    await markCourseMediaPendingWithClient(input);
    return { ok: false as const, state: 'media_pending' as const, media };
  }

  // Media completion is necessary but not sufficient. Re-run the same full
  // CoursePackage contract used by authoring before a build can enter review.
  const contract = await evaluatePersistedCredentialCourse(input.courseId);
  if (!contract.pass) {
    const mediaGates = new Set([
      'demonstration',
      'visual_alignment',
      'captions',
      'transcript',
      'progress_tracking',
      'resume_tracking',
    ]);
    const mediaFailures = contract.findings.filter((finding) => mediaGates.has(finding.gate));
    if (mediaFailures.length) {
      await markCourseMediaPendingWithClient(input);
      return {
        ok: false as const,
        state: 'media_pending' as const,
        media,
        contract,
      };
    }
    return {
      ok: false as const,
      state: 'review_pending' as const,
      media,
      contract,
    };
  }

  const now = new Date().toISOString();
  const { error } = await input.db
    .from('courses')
    .update({
      generation_status: 'completed',
      generation_progress: 100,
      status: 'draft',
      review_status: 'draft',
      reviewed_by: null,
      reviewed_at: null,
      published_at: null,
      published_by: null,
      updated_at: now,
    })
    .eq('id', input.courseId)
    .neq('status', 'published');
  if (error) throw error;

  return { ok: true as const, state: 'ready_for_review' as const, media };
}
