import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {dispatchQueuedCourseJob} from './dispatch-course-job.mjs';

// Exercise the dispatcher's actual REST query, but never give this probe a
// Google runner or return jobs to the launch path. Reads only; no claims/writes.
export async function probeCourseDispatchQueue({env=process.env,request=fetch}={}) {
 let sampled=0,eligible=0;
 const read=async url=>{
  const response=await request(url,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,
   Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('COURSE_QUEUE_PROJECTION_HTTP_'+response.status);
  const rows=await response.json();
  assert.ok(Array.isArray(rows),'COURSE_QUEUE_PROJECTION_INVALID');
  for(const row of rows)assert.ok(row.build && !Array.isArray(row.build) &&
   Object.hasOwn(row.build,'owner_paused'),'COURSE_QUEUE_PARENT_PROJECTION_INVALID');
  return rows;
 };
 await dispatchQueuedCourseJob({env,run:(_command,args)=>{
  assert.deepEqual(args.slice(0,4),['run','jobs','executions','list'],'PROBE_CANNOT_LAUNCH_WORK');
  return '[]';
 },request:async url=>{
  // Also inspect existing rows independent of queue state so an empty queue
  // cannot conceal an invalid relationship shape or JSON projection.
  const sample=new URL(url);
  sample.searchParams.delete('or');sample.searchParams.delete('build.or');
  sample.searchParams.set('limit','1');
  sampled=(await read(sample)).length;
  assert.ok(sampled>0,'COURSE_QUEUE_PROJECTION_NO_SAMPLE');
  const rows=await read(url);
  assert.ok(rows.every(row=>row.build.owner_paused!==true && row.build.owner_paused!=='true'),
   'COURSE_QUEUE_PAUSED_FILTER_FAILED');
  eligible=rows.length;
  return {ok:true,json:async()=>[]};
 }});
 const result={projectionVerified:true,pausedFilterVerified:true,sampledRows:sampled,eligibleRows:eligible,readOnly:true};
 console.info(JSON.stringify(result));return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)
 await probeCourseDispatchQueue();
