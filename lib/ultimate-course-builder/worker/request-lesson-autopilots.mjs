/** A stopped full-course build needs a durable continuation before pool handoff. */
export async function requestLessonAutopilots(db,{buildId,actorId,enqueue}) {
 const build=await db.from('ultimate_course_builds').select('id,status,profile').eq('id',buildId).single();
 if(build.error)throw build.error;
 if(!build.data || ['published','archived','cancelled'].includes(build.data.status))throw Error('ULTIMATE_AUTOPILOT_UNFINISHED_BUILD_REQUIRED');
 if(build.data.profile?.ownerPaused===true)throw Error('OWNER_PAUSED_REFERENCE_BUILD');
 const jobs=await db.from('ultimate_build_jobs').select('id,status,payload').eq('build_id',buildId).eq('job_type','course_build').order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(jobs.error)throw jobs.error;
 const payload=jobs.data?.payload ?? {};
 if(payload.ownerPreview || payload.acceptance || payload.competencyId || payload.lessonBuildId)throw Error('ULTIMATE_AUTOPILOT_FULL_COURSE_REQUIRED');
 if(!jobs.data || !['queued','running'].includes(jobs.data.status))
  await enqueue(buildId,{requestedBy:actorId,parallelAutopilotStart:true});
 const result=await db.rpc('request_ultimate_autopilot_pool',{p_build:buildId,p_actor:actorId});
 if(result.error)throw result.error;
 return result.data;
}
