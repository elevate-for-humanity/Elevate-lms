// Recover the existing HVAC complete-lesson build through a fenced, capacity-checked dispatch.
// Usage: APPROVED_WORKER_DIGEST=sha256:<64-hex> SUPABASE_SERVICE_ROLE_KEY=... node scripts/gcp/recover-hvac-complete-lessons.mjs
// This is an explicit operator recovery, not a blanket override of paused or leased work.
import { createClient } from '@supabase/supabase-js';
import { google, PROJECT } from './runtime-config.mjs';
import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';
const COURSE = '511aefe6-15fe-47b2-8eca-d55da4f31c51';
const BUILD = 'd535e31f-10e6-43dd-b60a-e7e5538d764a';
const JOB = '40cf8fbf-57b5-4206-8cb9-b6538f59da8b';
const expected = process.env.APPROVED_WORKER_DIGEST;
if (!/^sha256:[a-f0-9]{64}$/.test(expected ?? '')) throw Error('APPROVED_WORKER_DIGEST_REQUIRED');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('DATABASE_AUTH_REQUIRED');
const current = JSON.parse(google(['run','jobs','describe','elevate-course-builder','--project='+PROJECT,'--region=us-central1','--format=json']));
const image = current.spec?.template?.spec?.template?.spec?.containers?.[0]?.image;
if (!image?.endsWith('@'+expected)) throw Error('APPROVED_COMPLETE_LESSON_WORKER_NOT_DEPLOYED');
const db = createClient('https://cuxzzpsyufcewtmicszk.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY,
  {auth:{persistSession:false,autoRefreshToken:false}});
const {data:build,error:buildError} = await db.from('ultimate_course_builds')
  .select('id,course_id,status,profile').eq('id',BUILD).single();
if (buildError) throw buildError;
if (build.course_id!==COURSE || build.profile?.ownerPaused===true) throw Error('BUILD_NOT_ELIGIBLE');
const {data:job,error:jobError} = await db.from('ultimate_build_jobs')
  .select('id,build_id,status,job_type,last_error,attempts,max_attempts,execution_generation,lease_owner,lease_expires_at')
  .eq('id',JOB).single();
if (jobError) throw jobError;
if (job.build_id!==BUILD || job.job_type!=='course_build') throw Error('WRONG_JOB');
if (job.status==='queued' || job.status==='running') {
  console.log(JSON.stringify({status:'already_eligible_or_running',jobId:JOB}));
  process.exit(0);
}
if (build.status!=='blocked' || job.status!=='failed' || job.last_error!=='WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER' ||
  job.attempts>=job.max_attempts || job.lease_owner || (job.lease_expires_at && Date.parse(job.lease_expires_at)>Date.now()))
  throw Error('RECOVERY_PRECONDITIONS_CHANGED');
const now = new Date().toISOString();
const {data:changed,error:updateError}=await db.from('ultimate_build_jobs')
  .update({status:'queued',last_error:null,available_at:now,execution_generation:job.execution_generation+1,updated_at:now})
  .eq('id',JOB).eq('status','failed').eq('execution_generation',job.execution_generation)
  .eq('last_error','WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER').is('lease_owner',null).select('id');
if (updateError || changed?.length!==1) throw updateError ?? Error('JOB_ALREADY_CHANGED');
const {error:buildUpdateError}=await db.from('ultimate_course_builds')
  .update({status:'queued',updated_at:now}).eq('id',BUILD).eq('status','blocked');
if (buildUpdateError) throw buildUpdateError;
const result=await dispatchQueuedCourseJob();
if (result.status!=='assigned' && result.status!=='busy' && result.status!=='capacity_wait')
  throw Error('DISPATCH_NOT_CONFIRMED:'+JSON.stringify(result));
console.log(JSON.stringify({courseId:COURSE,jobId:JOB,dispatch:result}));
