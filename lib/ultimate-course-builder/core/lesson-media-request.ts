import type { SupabaseClient } from '@supabase/supabase-js';
import { assertCourseBuilderGenerationEnabled } from './generation-control';
import { UltimateJobQueue } from '../worker/job-queue';
import { requestCourseWorker } from '@/lib/gcp/course-worker-launch';
import { recordCourseDispatch } from '../worker/dispatch-evidence';

export class LessonMediaRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Historical media URLs can request one saved competency, never an entire course. */
export async function queueCanonicalLessonMedia(db: SupabaseClient, input: {
  courseId: string; lessonId: string; validateOnly?: boolean; force?: boolean;
}, actorId: string) {
  if (![input.courseId, input.lessonId].every(id => /^[a-f0-9-]{36}$/i.test(id || '')))
    throw new LessonMediaRequestError('A saved courseId and lessonId are required.', 400);
  await assertCourseBuilderGenerationEnabled(db, input.courseId);
  const lesson = await db.from('course_lessons').select('id,content_json,video_url')
    .eq('id', input.lessonId).eq('course_id', input.courseId).maybeSingle();
  if (lesson.error) throw lesson.error;
  if (!lesson.data) throw new LessonMediaRequestError('Lesson does not belong to this course.', 404);
  const result = await db.from('ultimate_course_builds').select('id,status,profile')
    .eq('course_id', input.courseId).neq('status', 'archived')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  const build = result.data;
  if (!build || build.status === 'published')
    throw new LessonMediaRequestError('Save a draft in the current Course Builder before requesting lesson media.', 409);
  if (build.profile?.ownerPaused === true)
    throw new LessonMediaRequestError('This build is paused. Use its authenticated Resume action.', 409);
  if (build.profile?.parallelAutopilot === 'three-role-v1') {
    const pool = await db.from('ultimate_autopilot_pools').select('state').eq('build_id', build.id).maybeSingle();
    if (pool.error) throw pool.error;
    if (pool.data && pool.data.state !== 'completed')
      throw new LessonMediaRequestError('The course autopilot still owns this lesson. Use its checkpoint workspace.', 409);
  }
  const competency = build.profile?.competencies?.find((c: { id: string }) =>
    c.id === lesson.data.id || c.id === lesson.data.content_json?.competencyId ||
    build.profile.canonicalLessonIds?.[c.id] === lesson.data.id);
  if (!competency) throw new LessonMediaRequestError('Lesson is not mapped to this saved production contract.', 409);
  if (build.profile.canonicalLessonIds?.[competency.id] !== lesson.data.id)
    throw new LessonMediaRequestError('Complete the canonical lesson mapping in the current Course Builder before requesting media.', 409);
  const active = await db.from('ultimate_build_jobs').select('id,status,payload')
    .eq('build_id', build.id).eq('job_type', 'course_build').in('status', ['queued', 'running']).maybeSingle();
  if (active.error) throw active.error;
  const matches = (job: { payload?: { competencyId?: string } }) => job.payload?.competencyId === competency.id;
  if (active.data && !matches(active.data))
    throw new LessonMediaRequestError('Other production work already owns this build. Its scope was preserved.', 409);
  const base = { authority: 'ultimate-course-builder', buildId: build.id, charged: false,
    result: { queued: 0, microclipsQueued: 0, failed: 0, wouldQueue: active.data ? 0 : 1, alreadyActive: active.data ? 1 : 0 } };
  if (input.validateOnly || active.data)
    return { ...base, ok: true, status: input.validateOnly ? 'validated' : 'already_active', jobId: active.data?.id };
  if (!input.force && lesson.data.video_url)
    return { ...base, ok: true, status: 'already_present', result: { ...base.result, wouldQueue: 0 } };
  const job = await new UltimateJobQueue(db).enqueue(build.id, {
    requestedBy: actorId, competencyId: competency.id,
    ...(input.force ? { checkpointRepair: { competencyId: competency.id, fromStep: 'lesson_film_render', requestedBy: actorId, requestedAt: new Date().toISOString() } } : {}),
  });
  // Enqueue can return a concurrent winner. Never dispatch it as if it had this scope.
  if (!job || !matches(job)) throw new LessonMediaRequestError('Production scope changed. Refresh before retrying.', 409);
  const dispatch = await requestCourseWorker();
  await recordCourseDispatch(db, job.id, dispatch, actorId);
  return { ...base, ok: dispatch.dispatched, queued: true, jobId: job.id, ...dispatch,
    status: dispatch.dispatched ? 'queued' : 'dispatch_failed',
    result: { ...base.result, queued: 1, wouldQueue: 0 } };
}
