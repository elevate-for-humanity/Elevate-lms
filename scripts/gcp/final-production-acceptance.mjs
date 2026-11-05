import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {reconcileCanonicalReleases} from './canonical-release-reconciliation.mjs';
const PROJECT='elegant-racer-299721',DB='https://cuxzzpsyufcewtmicszk.supabase.co';
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error('PRODUCTION_SUPABASE_AUTH_REQUIRED');
const get=async(table,select,filter='',keyColumn='id')=>{
 if(!['id','course_id','lesson_id'].includes(keyColumn) || !select.split(',').includes(keyColumn))throw Error('PRODUCTION_STABLE_KEY_REQUIRED');
 const rows=[];
 const limit=500;
 let expected=null;
 for(let offset=0;offset<100000;offset+=limit){
  const url=new URL(DB+'/rest/v1/'+table);
  url.searchParams.set('select',select);
  url.searchParams.set('order',keyColumn+'.asc');
  url.searchParams.set('limit',String(limit));
  url.searchParams.set('offset',String(offset));
  if(filter){
   for(const [name,value] of new URLSearchParams(filter)){
    // A filter must never override pagination or the canonical projection.
    if(['limit','offset','order','select'].includes(name))throw Error('PRODUCTION_FILTER_CONTROL_NOT_ALLOWED:'+name);
    url.searchParams.set(name,value);
   }
  }
  const r=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'},signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw Error('PRODUCTION_READ_FAILED:'+table+':'+r.status);
  const page=await r.json();
  if(!Array.isArray(page))throw Error('PRODUCTION_READ_INVALID:'+table);
  const total=Number((r.headers.get('content-range')||'').split('/')[1]);
  if(!Number.isSafeInteger(total)||total<0)throw Error('PRODUCTION_COUNT_REQUIRED:'+table);
  if(expected===null)expected=total;
  if(total!==expected)throw Error('PRODUCTION_DATASET_CHANGED_DURING_SCAN:'+table);
  rows.push(...page);
  if(rows.length>=expected){
   if(rows.length!==expected||new Set(rows.map(row=>row[keyColumn])).size!==rows.length)throw Error('PRODUCTION_READ_INCONSISTENT:'+table);
   return {rows,count:expected};
  }
  if(page.length!==limit)throw Error('PRODUCTION_READ_INCOMPLETE:'+table);
 }
 throw Error('PRODUCTION_READ_LIMIT_EXCEEDED:'+table);
};
const sha=process.env.IMAGE_SHA||process.env.GITHUB_SHA;
const checks=[];
const add=(name,ok,details={})=>checks.push({name,ok,observedAt:new Date().toISOString(),...details});
if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('EXACT_RELEASE_SHA_REQUIRED');
try{
 const output=execFileSync('node',['scripts/gcp/verify-course-runtime-contract.mjs'],{encoding:'utf8',env:{...process.env,IMAGE_SHA:sha},timeout:360000});
 const result=JSON.parse(output);add('five_worker_digest_and_identity',result.verified===true,{workers:result.workers?.length||0});
}catch(e){add('five_worker_digest_and_identity',false,{reason:String(e.message).slice(0,160).replace(/Bearer\s+\S+/gi,'[redacted]')});}
const jobs=await get('ultimate_build_jobs','id,status,attempts,max_attempts,monitor,heartbeat_at,lease_expires_at,build:ultimate_course_builds!inner(status,profile)');
const counts=Object.fromEntries(['completed','failed','queued','running'].map(s=>[s,jobs.rows.filter(j=>j.status===s).length]));
// Historical failures and explicitly owner-paused builds are retained for
// audit, not reclassified as completed or counted as runnable production work.
if(jobs.rows.some(j=>!j.build || Array.isArray(j.build) || typeof j.build.status!=='string'))
 throw Error('PRODUCTION_BUILD_SCOPE_EVIDENCE_REQUIRED');
const eligible=jobs.rows.filter(j=>j.build.profile?.ownerPaused!==true &&
 !['published','archived','cancelled'].includes(j.build.status));
const paused=jobs.rows.filter(j=>j.build.profile?.ownerPaused===true);
const actionableFailed=eligible.filter(j=>j.status==='failed');
const actionableQueued=eligible.filter(j=>j.status==='queued');
const actionableRunning=eligible.filter(j=>j.status==='running');
const unmonitored=eligible.filter(j=>['failed','queued','running'].includes(j.status)&&j.monitor?.enabled!==true).length;
const stale=jobs.rows.filter(j=>j.status==='running'&&(!j.heartbeat_at||!Number.isFinite(Date.parse(j.heartbeat_at))||Date.now()-Date.parse(j.heartbeat_at)>300000||!j.lease_expires_at||Date.parse(j.lease_expires_at)<=Date.now())).length;
const exhausted=actionableFailed.filter(j=>j.attempts>=j.max_attempts).length;
add('paris_monitoring',unmonitored===0,{unmonitored});
add('worker_heartbeat',stale===0,{stale});
add('failed_jobs_reconciled',actionableFailed.length===0,{failed:actionableFailed.length,historicalOrPausedFailures:counts.failed-actionableFailed.length,exhausted});
add('queue_drained',actionableQueued.length===0&&actionableRunning.length===0,
 {queued:actionableQueued.length,running:actionableRunning.length,ownerPaused:paused.length});
const repairs=await get('paris_code_repairs','id,status');
const blocked=repairs.rows.filter(r=>r.status==='blocked').length;
add('paris_code_repairs',blocked===0,{blocked});
const courses=await get('courses','id,title,status','status=eq.published');
const releases=await get('ultimate_release_versions','id,course_id,status','status=eq.released');
const allReleases=await get('ultimate_release_versions','id,course_id,status,package');
const allLessons=await get('course_lessons','id,course_id,status,is_published,video_status,video_url,order_index,media_attachment:content_json->mediaAttachment');
const missing=[];
const incremental=[];
for(const course of courses.rows){
 if(releases.rows.some(r=>r.course_id===course.id))continue;
 const flagged=allLessons.rows.filter(l=>l.course_id===course.id&&l.is_published===true);
 const validReceipt=lesson=>{
  const attachment=lesson.media_attachment;
  return lesson.video_status==='complete'&&Boolean(lesson.video_url)&&
   attachment?.publicationPending===false&&
   typeof attachment.sourceLessonBuildId==='string'&&
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attachment.sourceLessonBuildId)&&
   Number.isFinite(Date.parse(attachment.publishedAt??''));
 };
 if(flagged.length>0&&flagged.every(l=>l.status==='published'&&validReceipt(l)))incremental.push(course.title);
 else missing.push(course.title);
}
add('canonical_publication',missing.length===0,{missing,incrementalWithoutFullVersion:incremental});
const pacingPlans=await get('course_pacing_plans','course_id,total_weeks,enabled','enabled=eq.true','course_id');
const releaseWeeks=await get('course_lesson_release_weeks','lesson_id,course_id,release_week','','lesson_id');
const byLesson=new Map(releaseWeeks.rows.map(row=>[row.lesson_id,row]));
const chronologyFindings=[];
for(const plan of pacingPlans.rows){
 const lessons=allLessons.rows.filter(l=>l.course_id===plan.course_id&&l.is_published===true)
  .sort((a,b)=>(a.order_index??-1)-(b.order_index??-1));
 let previousWeek=0,previousOrder=-1;
 for(const lesson of lessons){
  const week=byLesson.get(lesson.id);
  const order=lesson.order_index;
  if(!Number.isInteger(order)||order<0||order===previousOrder||
     !week||week.course_id!==plan.course_id||
     !Number.isInteger(week.release_week)||week.release_week<1||
     week.release_week>plan.total_weeks||week.release_week<previousWeek){
   chronologyFindings.push({courseId:plan.course_id,lessonId:lesson.id,code:'PACING_RELEASE_ORDER_OR_MAPPING_INVALID'});
   continue;
  }
  previousWeek=week.release_week;previousOrder=order;
 }
}
add('weekly_release_chronology',chronologyFindings.length===0,{enabledPlans:pacingPlans.count,findings:chronologyFindings});
const canonicalReconciliation=reconcileCanonicalReleases(allReleases.rows,allLessons.rows);
add('canonical_release_media_consistency',canonicalReconciliation.ok,{
 checkedReleases:canonicalReconciliation.checkedReleases,
 checkedCourses:canonicalReconciliation.checkedCourses,
 findings:canonicalReconciliation.findings,
});
mkdirSync('audit-output',{recursive:true});
const report={project:PROJECT,sha,observedAt:new Date().toISOString(),counts,checks,productionReady:checks.every(c=>c.ok),note:'Read-only database and Cloud Run gates. Authenticated learner playback and financial delivery require separate real acceptance receipts.'};
writeFileSync('audit-output/production-acceptance.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(!report.productionReady)process.exitCode=1;
