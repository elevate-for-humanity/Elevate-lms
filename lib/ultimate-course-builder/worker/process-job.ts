import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateJobQueue } from './job-queue';
import { createUltimateRuntime } from '../core/runtime-factory';
import { createProductionHandlers } from '../core/production-handlers';
import { UltimateBuildRunner } from '../core/build-runner';
import { runUltimateCourse } from '../core/full-course-runner';
import type { UltimateCredentialProfile } from '../core/types';
import { assertCompleteLesson } from '../core/lesson-contract';
import { UltimateReleaseService } from '../release/release-service';
import { nextCourseWork } from './course-cursor';
import { resolveReleaseActor } from './release-actor';
import { hydrateUltimateProfileSources } from '../core/course-profile';
export async function processUltimateJob(db: SupabaseClient, workerId: string) {
  const queue = new UltimateJobQueue(db);
  const job = await queue.claim(workerId, 300);
  if (!job) return { claimed: false };
  let timer: ReturnType<typeof setInterval> | null = setInterval(
    () => void queue.heartbeat(job.id, workerId, 300).catch(() => {}),
    60000,
  );
  try {
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,course_id,profile,status')
      .eq('id', job.build_id)
      .single();
    if (error || !build) throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    const storedProfile = build.profile as UltimateCredentialProfile;
    if (!storedProfile?.competencies?.length) throw new Error('ULTIMATE_PROFILE_REPAIR_REQUIRED');
    const profile = await hydrateUltimateProfileSources(db, build.course_id, storedProfile);
    if (
      JSON.stringify(profile.instructionalSources ?? []) !==
      JSON.stringify(storedProfile.instructionalSources ?? [])
    ) {
      const { error: profileError } = await db
        .from('ultimate_course_builds')
        .update({ profile })
        .eq('id', build.id);
      if (profileError) throw profileError;
    }
    const runtime = await createUltimateRuntime(db);
    const handlers = createProductionHandlers(runtime);
    const payload = (job.payload ?? {}) as any;
    const targeted = Boolean(payload.competencyId || payload.lessonBuildId || payload.acceptance);
    const result = await runUltimateCourse(
      {
        buildId: build.id,
        courseId: build.course_id,
        profile,
        targetLessonBuildId: payload.lessonBuildId,
        targetCompetencyId:
          payload.competencyId ?? payload.repairCompetencyId ?? (payload.acceptance ? profile.competencies?.[0]?.id : undefined),
        startIndex: Number.isInteger(payload.nextCompetencyIndex) ? payload.nextCompetencyIndex : 0,
        maxLessons: 1,
      },
      () => new UltimateBuildRunner(handlers as any),
      runtime.persistence,
      runtime.artifacts,
    );
    if (!targeted) {
      const continuation = nextCourseWork(payload, result);
      if (continuation.continue) {
        await queue.yieldProgress(job.id, workerId, continuation.payload);
        return { claimed: true, completed: false, continuing: true, jobId: job.id, result };
      }
      if (continuation.unresolved?.length) {
        await queue.fail(job.id,workerId,`ULTIMATE_DEPENDENCIES_UNRESOLVED:${continuation.unresolved.join(',')}`,false);
        return {claimed:true,completed:false,jobId:job.id,result};
      }
    }
    if (!result.completed) {
      // Quality findings are repair work, not a terminal queue state. Requeue
      // the durable build so the worker resumes from its persisted checkpoint
      // and selective-repair plan instead of stranding the entire course.
      await queue.fail(
        job.id,
        workerId,
        `ULTIMATE_REPAIR_REQUIRED:${JSON.stringify(result.findings.map(f => ({step:f.step,code:f.code,message:f.message}))).slice(0,4000)}`,
      );
      return { claimed: true, completed: false, repairQueued: true, jobId: job.id, result };
    }
    if (!targeted) {
      // Completion is the current contract for every competency plus canonical
      // publication readback, never the last lesson's status or legacy flags.
      const { data: lessons, error: lessonError } = await db.from('ultimate_lesson_builds')
        .select('competency_id,status,artifacts').eq('build_id', build.id);
      if (lessonError) throw lessonError;
      for (const competency of profile.competencies) {
        const lesson = lessons?.find(l => l.competency_id === competency.id);
        if (!lesson || lesson.status !== 'built') throw new Error(`ULTIMATE_COMPETENCY_NOT_COMPLETE:${competency.id}`);
        assertCompleteLesson(lesson.artifacts, profile);
      }
      const releaseActor = await resolveReleaseActor(db, build.course_id, profile.mediaAcquisitionOwnerId);
      await runtime.persistence.updateBuild({buildId:build.id,status:'built',currentStep:'credential_release'});
      await new UltimateReleaseService(db).publish(build.id, releaseActor);
    }
    await queue.complete(job.id, workerId);
    return { claimed: true, completed: true, jobId: job.id, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await queue.fail(
      job.id,
      workerId,
      message,
      true,
    );
    return { claimed: true, completed: false, jobId: job.id, error: message };
  } finally {
    if (timer) clearInterval(timer);
    timer = null;
  }
}
