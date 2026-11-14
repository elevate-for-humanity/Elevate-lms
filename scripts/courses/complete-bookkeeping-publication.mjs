import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
const ROOT='https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/';
export const TARGET=Object.freeze({course:'5a72b6d1-6a05-4294-832b-0a836ac4a74d',build:'88b2275e-ab36-4aad-b696-c5ebe491fd4e',repair:'99d90bbd0641a788d9413dc4ed7a019c6676d80b',version:'icbp-elevate-rebuild-2026-10-31-v1'});
export function publicationReady({course,build,lessons}){
 if(course.id!==TARGET.course||course.metadata?.sourceVersion!==TARGET.version)throw Error('UNEXPECTED_COURSE_SOURCE');
 if(build.id!==TARGET.build||build.course_id!==TARGET.course||build.profile?.ownerPaused===true)throw Error('UNEXPECTED_OR_PAUSED_BUILD');
 const ids=Object.values(build.profile?.canonicalLessonIds??{});
 if(ids.length!==17||new Set(ids).size!==17||lessons.length!==18)throw Error('INSTRUCTIONAL_COURSE_STRUCTURE_INVALID');
 if(build.status!=='published'||course.status!=='published'||course.is_active!==true)return null;
 if(ids.some(id=>!lessons.some(l=>l.id===id&&l.status==='published'&&l.is_published===true&&l.video_status==='complete'&&l.media_quality_status==='approved'&&l.video_url&&l.source_build===TARGET.build&&l.contract_version)))return null;
 const practical=lessons.find(l=>l.id===build.profile.canonicalLessonIds['icbp-capstone']);
 if(!practical?.practical_required||!practical.requires_instructor_signoff)throw Error('PRACTICAL_EVIDENCE_GATE_MISSING');
 const final=lessons.find(l=>l.id===course.metadata.finalAssessmentLessonId);
 if(!final||!['quiz','exam'].includes(final.lesson_type)||final.order_index!==18||final.passing_score!==80||final.quiz_questions?.length!==25)throw Error('CUMULATIVE_FINAL_INVALID');
 const domains=new Set();
 for(const q of final.quiz_questions){
  if(!q.question?.trim()||!q.explanation?.trim()||q.options?.length!==4||!q.options.every(o=>typeof o==='string'&&o.trim())||!Number.isInteger(q.correctAnswer)||q.correctAnswer<0||q.correctAnswer>3)throw Error('FINAL_QUESTION_INVALID');
  domains.add(q.domain);
 }
 if(!['1','2','3','4'].every(d=>domains.has(d)))throw Error('FINAL_NOT_CUMULATIVE');
 return final;
}
export async function completePublication({env=process.env,request=fetch,delay=ms=>new Promise(r=>setTimeout(r,ms)),clock=Date.now,budgetMs=80*60_000}={}){
 if(env.GITHUB_REPOSITORY!=='elevate-for-humanity/Elevate-lms'||!env.SUPABASE_SERVICE_ROLE_KEY||!env.GH_TOKEN)throw Error('AUTHORIZED_PUBLICATION_CONNECTION_REQUIRED');
 const sourceProfile=p=>{const {ownerPaused,pauseResumeAudit,publishCompletedLessons,preservedPublishedLessonIds,parallelAutopilot,...source}=p??{};return source;};
 const token=env.SUPABASE_SERVICE_ROLE_KEY,headers={apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const db=async(table,params={},body)=>{
  const url=new URL(ROOT+table);for(const [k,v]of Object.entries(params))url.searchParams.set(k,v);
  const r=await request(url,{method:body?'PATCH':'GET',headers:{...headers,Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('PUBLICATION_DATABASE_HTTP_'+r.status+':'+table);
  return r.json();
 };
 const gh=async(path,method='GET',body)=>{
  const r=await request('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/'+path,{method,headers:{Authorization:'Bearer '+env.GH_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('PUBLICATION_GITHUB_HTTP_'+r.status);return r.status===204?null:r.json();
 };
 let last='',woke=false;const started=clock();
 while(clock()-started<budgetMs){
  const [runtime]=await db('ultimate_autopilot_runtime',{select:'image_sha,image_digest,roles'});
  let repaired=runtime?.image_sha===TARGET.repair;
  if(runtime?.image_sha&&!repaired){const compare=await gh('compare/'+TARGET.repair+'...'+runtime.image_sha);repaired=compare.merge_base_commit?.sha===TARGET.repair&&['ahead','identical'].includes(compare.status);}
  const [build]=await db('ultimate_course_builds',{id:'eq.'+TARGET.build,select:'id,course_id,status,profile'});
  if(!build||build.profile?.ownerPaused===true)throw Error('BUILD_MISSING_OR_OWNER_PAUSED');
  if(repaired){
   if(!/^sha256:[a-f0-9]{64}$/.test(runtime.image_digest??'')||!['instruction','media','quality'].every(role=>runtime.roles?.some(r=>r.role===role&&r.image.endsWith('@'+runtime.image_digest))))throw Error('VERIFIED_ROLE_RUNTIME_REQUIRED');
   const [pool]=await db('ultimate_autopilot_pools',{build_id:'eq.'+TARGET.build,select:'profile'});
   if(!isDeepStrictEqual(sourceProfile(pool?.profile),sourceProfile(build.profile)))throw Error('IMMUTABLE_SOURCE_PROFILE_CHANGED');
   const held=await db('ultimate_build_jobs',{build_id:'eq.'+TARGET.build,job_type:'like.*:media',status:'in.(queued,failed)',select:'id,status,attempts,max_attempts,execution_generation,lease_owner,lease_expires_at,monitor,last_error','monitor->>awaitingRepairImage':'eq.'+TARGET.repair});
   let resumed=0;
   for(const j of held){
    if(j.lease_owner&&Date.parse(j.lease_expires_at)>clock())continue;
    const monitor={...j.monitor,lastTimingRepair:{imageSha:runtime.image_sha,imageDigest:runtime.image_digest,previousError:j.last_error,at:new Date(clock()).toISOString()}};
    delete monitor.awaitingRepairImage;delete monitor.restartRetryLimit;
    const changed=await db('ultimate_build_jobs',{id:'eq.'+j.id,status:'eq.'+j.status,execution_generation:'eq.'+j.execution_generation,monitor:'eq.'+JSON.stringify(j.monitor)},{status:'queued',available_at:new Date(clock()).toISOString(),max_attempts:Math.max(Number(j.monitor.restartRetryLimit??j.max_attempts),j.attempts+1),execution_generation:j.execution_generation+(j.status==='failed'?1:0),last_error:null,monitor,updated_at:new Date(clock()).toISOString()});
    resumed+=changed.length;
   }
   if(resumed||!woke){await gh('actions/workflows/dispatch-google-course-job.yml/dispatches','POST',{ref:'main'});woke=true;console.log(JSON.stringify({event:'verified_media_continuation',resumed}));}
  }
  const [course]=await db('courses',{id:'eq.'+TARGET.course,select:'id,status,is_active,total_lessons,created_by,metadata'});
  const lessons=await db('course_lessons',{course_id:'eq.'+TARGET.course,select:'id,module_id,status,is_published,video_status,media_quality_status,video_url,source_build:content_json->>buildId,contract_version:content_json->>contractVersion,lesson_type,order_index,passing_score,quiz_questions,practical_required,requires_instructor_signoff'});
  const final=publicationReady({course,build,lessons});
  if(final){
   const [owner]=await db('profiles',{id:'eq.'+course.created_by,select:'role'});if(!['admin','super_admin'].includes(owner?.role))throw Error('VERIFIED_COURSE_OWNER_REQUIRED');
   const now=new Date(clock()).toISOString();
   await db('course_modules',{id:'eq.'+final.module_id,course_id:'eq.'+TARGET.course},{is_published:true,is_draft:false,updated_at:now});
   await db('course_lessons',{id:'eq.'+final.id,course_id:'eq.'+TARGET.course},{status:'published',is_published:true,generation_status:'completed',published_at:now,published_by:course.created_by,updated_at:now});
   await db('courses',{id:'eq.'+TARGET.course,status:'eq.published'},{total_lessons:18,metadata:{...course.metadata,cumulativeFinalPublishedAt:now,publicReopeningPending:true,publicationContinuationRun:env.GITHUB_RUN_ID},updated_at:now});
   const check=await db('course_lessons',{course_id:'eq.'+TARGET.course,select:'id,status,is_published'});
   const [saved]=await db('courses',{id:'eq.'+TARGET.course,select:'status,is_active,total_lessons'});
   if(check.length!==18||check.some(l=>l.status!=='published'||l.is_published!==true)||saved.status!=='published'||saved.is_active!==true||saved.total_lessons!==18)throw Error('PUBLICATION_READBACK_INCOMPLETE');
   console.log(JSON.stringify({event:'bookkeeping_lms_publication_verified',lessons:18,finalQuestions:25,publicOfferingStillWithdrawn:true}));return {published:true};
  }
  const progress=JSON.stringify({event:'publication_wait',repairedWorker:repaired,publishedLessons:lessons.filter(l=>l.is_published).length,buildStatus:build.status});
  if(progress!==last){console.log(progress);last=progress;}
  await delay(30000);
 }
 throw Error('PUBLICATION_CONTINUATION_TIME_BUDGET_EXHAUSTED');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await completePublication();
