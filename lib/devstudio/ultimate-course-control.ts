import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {UltimateJobQueue} from '@/lib/ultimate-course-builder/worker/job-queue';
import {UltimateReleaseService} from '@/lib/ultimate-course-builder/release/release-service';
import {startCanonicalCourse} from '@/lib/ultimate-course-builder/core/start-course';
import {requestCourseWorker} from '@/lib/gcp/course-worker-launch';
import {recordCourseDispatch} from '@/lib/ultimate-course-builder/worker/dispatch-evidence';

export class DevStudioUltimateCourseControl {
  constructor(private db:SupabaseClient) {}
  async queueCourse(input:{courseId:string;programSlug:string;actorId:string;title?:string;state?:string;goal?:string}) {
    const {data:course,error:courseError}=await this.db.from('courses').select('id,title')
      .eq('id',input.courseId).single();
    if(courseError || !course)throw courseError ?? new Error('ULTIMATE_COURSE_NOT_FOUND');
    const response=await startCanonicalCourse(this.db,{
      courseId:course.id,programSlug:input.programSlug,title:input.title || course.title,
      state:input.state,topic:input.goal,
    },input.actorId);
    const result=await response.json();
    if(!response.ok || result.ok!==true)throw new Error(result.error || 'ULTIMATE_DISPATCH_FAILED');
    const queued=await this.db.from('ultimate_build_jobs').select('*').eq('id',result.jobId).single();
    if(queued.error || !queued.data)throw queued.error ?? new Error('ULTIMATE_JOB_NOT_PERSISTED');
    return {build:result.build,job:queued.data,course,reused:result.reused};
  }

  async queue(buildId:string,requestedBy?:string|null) {
    if(!requestedBy)throw new Error('AUTHENTICATED_GENERATION_ACTOR_REQUIRED');
    const {data:build,error}=await this.db.from('ultimate_course_builds').select('id,course_id,status').eq('id',buildId).single();
    if(error || !build)throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    const job=await new UltimateJobQueue(this.db).enqueue(build.id,{requestedBy:requestedBy ?? null});
    if(!job?.id)throw new Error('ULTIMATE_JOB_NOT_PERSISTED');
    const dispatch=await requestCourseWorker();
    await recordCourseDispatch(this.db,job.id,dispatch,requestedBy);
    if(!dispatch.dispatched)throw new Error('ULTIMATE_DISPATCH_FAILED');
    return {build,job};
  }
  async status(buildId:string) {
    const [build,lessons,jobs]=await Promise.all([
      this.db.from('ultimate_course_builds').select('*').eq('id',buildId).single(),
      this.db.from('ultimate_lesson_builds').select('id,lesson_key,competency_id,status,findings,updated_at').eq('build_id',buildId).order('created_at'),
      this.db.from('ultimate_build_jobs').select('id,status,attempts,max_attempts,lease_owner,heartbeat_at,last_error,updated_at').eq('build_id',buildId).order('created_at',{ascending:false}),
    ]);
    for(const result of [build,lessons,jobs])if(result.error)throw result.error;
    if(!build.data)throw new Error('ULTIMATE_BUILD_NOT_FOUND');
    return {build:build.data,lessons:lessons.data ?? [],jobs:jobs.data ?? []};
  }
  async publish(buildId:string,actorId:string) {return new UltimateReleaseService(this.db).publish(buildId,actorId);}
}
