import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {UltimateJobQueue} from '@/lib/ultimate-course-builder/worker/job-queue';
import {UltimateReleaseService} from '@/lib/ultimate-course-builder/release/release-service';
import {buildUltimateProfile} from '@/lib/ultimate-course-builder/core/course-profile';

export class DevStudioUltimateCourseControl {
  constructor(private db:SupabaseClient) {}
  async queueCourse(input:{courseId:string;programSlug:string;actorId:string;title?:string;state?:string;goal?:string}) {
    const {data:course,error:courseError}=await this.db.from('courses').select('id,title')
      .eq('id',input.courseId).single();
    if(courseError || !course)throw courseError ?? new Error('ULTIMATE_COURSE_NOT_FOUND');
    const {data:existing,error:existingError}=await this.db.from('ultimate_course_builds')
      .select('id,status,current_step').eq('course_id',course.id).neq('status','published')
      .order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(existingError)throw existingError;
    let build=existing;
    if(!build) {
      const profile={...await buildUltimateProfile(this.db,{courseId:course.id,programSlug:input.programSlug,
        title:input.title || course.title,state:input.state,topic:input.goal}),mediaAcquisitionOwnerId:input.actorId};
      const created=await this.db.from('ultimate_course_builds').insert({course_id:course.id,profile,
        status:'initializing',current_step:'standards_lock',findings:[]}).select('id,status,current_step').single();
      if(created.error || !created.data)throw created.error ?? new Error('ULTIMATE_BUILD_CREATE_FAILED');
      build=created.data;
    }
    const queued=await this.queue(build.id,input.actorId);
    return {build,job:queued.job,course,reused:Boolean(existing)};
  }
  async queue(buildId:string,requestedBy?:string|null) {
    const {data:build,error}=await this.db.from('ultimate_course_builds').select('id,course_id,status').eq('id',buildId).single();
    if(error || !build)throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    const job=await new UltimateJobQueue(this.db).enqueue(build.id,{requestedBy:requestedBy ?? null});
    if(!job?.id)throw new Error('ULTIMATE_JOB_NOT_PERSISTED');
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
