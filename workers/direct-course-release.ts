import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createUltimateRuntime} from '../lib/ultimate-course-builder/core/runtime-factory';
import {createProductionHandlers} from '../lib/ultimate-course-builder/core/production-handlers';
import {artifactPayload,contractHash,currentEvidence,stepInputHash,stepInputHashes,validateStepOutput,assertCompleteLesson,practicalVisualFailures,ULTIMATE_LESSON_CONTRACT_VERSION} from '../lib/ultimate-course-builder/core/lesson-contract';
import {ULTIMATE_BUILD_STEPS,type UltimateBuildStep,type UltimateCredentialProfile} from '../lib/ultimate-course-builder/core/types';
import type {UltimateRunContext} from '../lib/ultimate-course-builder/core/build-runner';
import {UltimateReleaseService} from '../lib/ultimate-course-builder/release/release-service';
import {createCourseProgressWatch} from '../lib/ultimate-course-builder/worker/progress-watch.mjs';
import {createDirectDatabaseFetch} from './direct-database-fetch.mjs';
import {resolveReleaseActor} from '../lib/ultimate-course-builder/worker/release-actor';
import {runDirectLessonPass,directCourseComplete,runDirectCourseSequence,directFailureEvidence,directLessonEditorialHold,directCourseNeedsFinalPublication,directStepIdleDeadline} from './direct-course-policy.mjs';

// Reuse media tools and release validators, but never invoke the build runner,
// role dispatcher, automatic repair router, or any queue operation.
// Finish EPA/HVAC first for current learners, then Barber, then Business.
const TARGET_GROUPS=[
 ['adc2ae08-f739-41e1-ac86-b79802e46f19','60861eb2-2d25-44b8-8193-3721aae716c9'],
 ['b400834e-15e3-4ef0-ae20-33cd9f82e950'],
 ['42688955-1d2c-4988-a2c8-9e46cd9b3499'],
];
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error('DIRECT_RELEASE_DATABASE_AUTH_REQUIRED');
const db=createClient('https://cuxzzpsyufcewtmicszk.supabase.co',key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:createDirectDatabaseFetch()}});
const producer=process.env.DIRECT_RELEASE_SOURCE_SHA;
if(!/^[a-f0-9]{40}$/.test(producer??''))throw Error('DIRECT_RELEASE_TESTED_SOURCE_REQUIRED');
const runId=randomUUID();
// Only a relevant direct-engine repair may retry an unchanged rejected input;
// unrelated repository commits and worker deployments are not new evidence.
const engineRevision='direct-single-pass-no-google-2026-10-30.2';
const safeCode=(error:unknown)=>error instanceof Error?(error.message.match(/^[A-Z][A-Z0-9_]+/)?.[0]??'DIRECT_COMPONENT_FAILED'):'DIRECT_COMPONENT_FAILED';

async function main(buildId:string){
 const loaded=await db.from('ultimate_course_builds').select('id,course_id,profile,status').eq('id',buildId).single();
 if(loaded.error||!loaded.data)throw loaded.error??Error('DIRECT_RELEASE_SOURCE_NOT_FOUND');
 const build=loaded.data;
 const profile=build.profile as UltimateCredentialProfile&{ownerPaused?:boolean};
 if(profile.ownerPaused!==true)throw Error('DIRECT_RELEASE_REQUIRES_BUILDER_PAUSED');
 const sourceHash=contractHash(profile);
 const assertSource=async()=>{
  const latest=await db.from('ultimate_course_builds').select('profile').eq('id',build.id).single();
  if(latest.error)throw latest.error;
  if(contractHash(latest.data.profile)!==sourceHash)throw Error('DIRECT_RELEASE_SOURCE_CHANGED');
 };
 // Do not overwrite a renderer that was already active when the owner switched
 // to direct release. Its ordinary checkpoint/pause handling drains the lease.
 for(let wait=0;;wait++){
  const active=await db.from('ultimate_build_jobs').select('id,lease_expires_at').eq('build_id',build.id).eq('status','running').gt('lease_expires_at',new Date().toISOString());
  if(active.error)throw active.error;
  if(!active.data?.length)break;
  if(wait>=36)throw Error('DIRECT_RELEASE_ACTIVE_PRODUCER_LEASE');
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 const runtime=await createUltimateRuntime(db);
 const handlers=createProductionHandlers(runtime);
 const release=new UltimateReleaseService(db);
 const actor=await resolveReleaseActor(db,build.course_id,profile.mediaAcquisitionOwnerId);
 const inventory=await db.from('ultimate_lesson_builds').select('id,competency_id,lesson_key,status').eq('build_id',build.id).order('created_at');
 if(inventory.error)throw inventory.error;
 const accepted:string[]=[],blocked:Array<{lesson:string;step:string;reason:string}>=[];
 for(const lesson of inventory.data??[]){
  await assertSource();
  const canonicalLessonId=profile.canonicalLessonIds?.[lesson.competency_id];
  if(!canonicalLessonId)throw Error('DIRECT_RELEASE_CANONICAL_ID_REQUIRED');
  const editorial=await db.from('course_lessons').select('content_json').eq('course_id',build.course_id).eq('id',canonicalLessonId).single();
  if(editorial.error)throw editorial.error;
  if(directLessonEditorialHold(editorial.data.content_json)){
   blocked.push({lesson:lesson.competency_id,step:'learning_objectives',reason:'MANUAL_FILM_SOURCE_REVISION_REQUIRED'});
   console.log(JSON.stringify({courseId:build.course_id,lessonId:lesson.competency_id,state:'editorial-hold',code:'MANUAL_FILM_SOURCE_REVISION_REQUIRED'}));
   continue;
  }
  const saved=await db.from('ultimate_lesson_builds').select('artifacts').eq('id',lesson.id).single();
  if(saved.error)throw saved.error;
  const cachedArtifacts=saved.data.artifacts as UltimateRunContext['artifacts'];
  // Handlers see only validated dependencies. Future cached stages stay in
  // durable storage for recovery; they are never mistaken for current inputs.
  const artifacts:UltimateRunContext['artifacts']={};
  const context:UltimateRunContext={buildId:build.id+':'+lesson.competency_id,courseId:build.course_id,profile,lessonBuildId:lesson.id,artifacts,findings:[],passedSteps:new Set()};
  const snapshot=structuredClone(cachedArtifacts);
  await runtime.artifacts.createVersion({buildId:build.id,lessonBuildId:lesson.id,stage:'selective_repair',artifactType:'direct-release-snapshot',logicalKey:`direct-release:${runId}:${lesson.id}`,content:snapshot,generatedBy:'direct-lms-release',changeReason:'Owner directed completion outside the automatic course builder; retain all prior artifacts.'});
  const attempts=new Map<string,string>();
  const reusable=async(step:UltimateBuildStep)=>{
   const hashes=stepInputHashes(step,profile,artifacts);
   let value=cachedArtifacts[step];
   const valid=(candidate:Record<string,unknown>|undefined)=>currentEvidence(candidate,hashes)&&!validateStepOutput(step,candidate??{}).length;
   if(!valid(value)){
    const catalog=await db.from('ultimate_artifacts').select('id').eq('build_id',build.id).eq('lesson_build_id',lesson.id).eq('stage',step).eq('artifact_type','stage_output').limit(2);
    if(catalog.error)throw catalog.error;
    for(const entry of catalog.data??[]){
     const versions=await db.from('ultimate_artifact_versions').select('content').eq('artifact_id',entry.id).order('version',{ascending:false}).limit(20);
     if(versions.error)throw versions.error;
     const matching=versions.data?.find(row=>valid(row.content));
     if(matching){value=matching.content;break;}
    }
   }
   if(!valid(value))return false;
   const competency=profile.competencies.find(item=>item.id===lesson.competency_id);
   if(step==='visual_assignment'&&practicalVisualFailures({...artifacts,visual_assignment:value},competency).length)return false;
   artifacts[step]=value!;context.passedSteps!.add(step);return true;
  };
  const result=await runDirectLessonPass({steps:ULTIMATE_BUILD_STEPS,reusable,
   fingerprint:async(step:UltimateBuildStep)=>contractHash({input:stepInputHash(step,profile,artifacts),engineRevision,...(step==='learner_runthrough'?{learnerDeadlineRevision:'full-playback-one-hour-v1'}:{}),...(step==='lesson_film_render'?{photoGenerationRevision:'photographic-course-cues-v6-bounded-pairs'}:{}),...(step==='learning_objectives'&&['a21cd441-9809-4b22-889e-880948e902b6','c80f470b-8250-4c0c-b866-7c2035813aed'].includes(lesson.competency_id)?{repairRevision:'hvac-nontechnical-safety-context-v1'}:{})}),
   attempted:async(step:UltimateBuildStep,fingerprint:string)=>{
    const logicalKey=`direct-failure:${lesson.id}:${step}:${fingerprint}`;attempts.set(step,logicalKey);
    const prior=await db.from('ultimate_artifacts').select('id').eq('build_id',build.id).eq('logical_key',logicalKey).maybeSingle();
    if(prior.error)throw prior.error;return Boolean(prior.data);
   },
   execute:async(step:UltimateBuildStep)=>{
    await assertSource();console.log(JSON.stringify({courseId:build.course_id,lessonId:lesson.competency_id,step,state:'executing-once'}));
    // No failure is routed backwards. A failed component is diagnosed for an
    // explicit source correction; saved narration and films remain untouched.
    const watch=createCourseProgressWatch({idleMs:directStepIdleDeadline(step),onProgress:async(progress:any)=>{console.log(JSON.stringify({courseId:build.course_id,lessonId:lesson.competency_id,step,state:'progress',...progress}));}});
    try{const result=await watch.race(watch.run(()=>handlers[step](context)));await watch.flush();return result;}finally{watch.dispose();}
   },
   validate:async(step:UltimateBuildStep,result:Awaited<ReturnType<(typeof handlers)[string]>>)=>{
    if(result.passed===false||result.findings?.some(finding=>finding.severity==='error'))throw Error(result.findings?.find(finding=>finding.severity==='error')?.code??'DIRECT_COMPONENT_QUALITY_FAILED');
    const payload=artifactPayload(result.artifacts??{});
    if(step==='selective_repair')payload.repair={attempts:[],unresolved:0,mode:'direct-single-pass'};
    const failures=validateStepOutput(step,payload);
    if(step==='visual_assignment')failures.push(...practicalVisualFailures({...artifacts,visual_assignment:payload},profile.competencies.find(item=>item.id===lesson.competency_id)));
    if(failures.length)throw Error(failures.join(';'));
    result.artifacts=payload;
   },
   save:async(step:UltimateBuildStep,result:Awaited<ReturnType<(typeof handlers)[string]>>)=>{
    await assertSource();const payload=artifactPayload(result.artifacts??{});
    const certified={...payload,contractEvidence:{version:ULTIMATE_LESSON_CONTRACT_VERSION,inputHash:stepInputHash(step,profile,artifacts),outputHash:contractHash(payload),passed:true,checkedAt:new Date().toISOString()}};
    await runtime.artifacts.createVersion({buildId:build.id,lessonBuildId:lesson.id,stage:step,artifactType:'stage_output',logicalKey:`lesson:${lesson.id}:stage:${step}`,content:certified,generatedBy:'direct-lms-release',changeReason:'Completed one component directly; no automatic rewind or retry.'});
    artifacts[step]=certified;context.passedSteps!.add(step);
    await runtime.persistence.saveArtifact({lessonBuildId:lesson.id,artifacts:{...snapshot,...artifacts}});
    await runtime.persistence.recordStep({lessonBuildId:lesson.id,step,state:'passed',artifacts:certified,findings:[]});
   },
   reject:async(step:UltimateBuildStep,fingerprint:string,error:unknown)=>{
    await assertSource();const failure=directFailureEvidence(error);const {code}=failure;
    await runtime.artifacts.createVersion({buildId:build.id,lessonBuildId:lesson.id,stage:step,artifactType:'direct-release-failure',logicalKey:attempts.get(step)??`direct-failure:${lesson.id}:${step}:${fingerprint}`,content:{step,...failure,inputFingerprint:fingerprint,producer,runId},generatedBy:'direct-lms-release',changeReason:'One failed component retained; unchanged inputs may not automatically repeat.'});
    console.log(JSON.stringify({courseId:build.course_id,lessonId:lesson.competency_id,step,state:'blocked',...failure}));
   },
  });
  if(!result.complete){blocked.push({lesson:lesson.competency_id,step:result.blockedAt,reason:result.reason});continue;}
  try {
  assertCompleteLesson(artifacts,profile,lesson.competency_id);
  await assertSource();
  await runtime.persistence.finishLesson({lessonBuildId:lesson.id,status:'built',artifacts,findings:[]});
  const canonicalId=profile.canonicalLessonIds?.[lesson.competency_id];
  if(!canonicalId)throw Error('DIRECT_RELEASE_CANONICAL_ID_REQUIRED');
  const order=await db.from('course_lessons').select('order_index').eq('id',canonicalId).eq('course_id',build.course_id).single();
  if(order.error)throw order.error;
  const packageForLesson=await release.derive(build.id,lesson.id);
  packageForLesson.lessons[0].orderIndex=order.data.order_index;
  await release.applyPackage(packageForLesson,actor);
  const measuredDuration=Math.ceil(artifacts.lesson_film_render!.render.duration);
  const duration=await db.from('course_lessons').update({duration_seconds:measuredDuration,duration_minutes:Math.ceil(measuredDuration/60)}).eq('id',canonicalId).eq('course_id',build.course_id).eq('video_url',packageForLesson.lessons[0].videoUrl);
  if(duration.error)throw duration.error;
  const verified=await db.from('course_lessons').select('id,status,is_published,video_status,media_quality_status,duration_seconds').eq('id',canonicalId).single();
  if(verified.error)throw verified.error;
  if(verified.data.status!=='published'||verified.data.is_published!==true||verified.data.video_status!=='complete'||verified.data.media_quality_status!=='approved'||verified.data.duration_seconds!==measuredDuration)throw Error('DIRECT_LESSON_PUBLICATION_READBACK_FAILED');
  accepted.push(canonicalId);
  console.log(JSON.stringify({courseId:build.course_id,lessonId:canonicalId,state:'published-and-verified'}));
  } catch(error) {
   const code=safeCode(error);blocked.push({lesson:lesson.competency_id,step:'publication',reason:code});
   console.log(JSON.stringify({courseId:build.course_id,lessonId:lesson.competency_id,step:'publication',state:'blocked',code}));
  }
 }
 const canonical=await db.from('course_lessons').select('id,module_id,status,is_published,video_status,media_quality_status,media_quality_evidence,content_json').eq('course_id',build.course_id);
 if(canonical.error)throw canonical.error;
 const learnerRows=(canonical.data??[]).filter(row=>row.content_json?.sourceOnly!==true);
 const learnerLessonIds=learnerRows.map(row=>row.id);
 // Aggregate independently validated canonical lessons across source snapshots.
 // HVAC's preserved Core/Type I snapshot and its remaining 14 lessons must both
 // be accepted; neither snapshot is allowed to claim the entire course alone.
 const allAccepted:string[]=[];
 for(const row of learnerRows){
  if(row.status!=='published'||row.is_published!==true||row.video_status!=='complete'||row.media_quality_status!=='approved')continue;
  const sourceLessonId=row.content_json?.sourceLessonBuildId;
  if(!sourceLessonId)continue;
  const evidence=await db.from('ultimate_lesson_builds').select('build_id,competency_id,status,artifacts').eq('id',sourceLessonId).single();
  if(evidence.error||evidence.data.status!=='built')continue;
  const sourceBuild=await db.from('ultimate_course_builds').select('course_id,profile').eq('id',evidence.data.build_id).single();
  if(sourceBuild.error||sourceBuild.data.course_id!==build.course_id)continue;
  try{assertCompleteLesson(evidence.data.artifacts,sourceBuild.data.profile,evidence.data.competency_id);}catch{continue;}
  const mediaHash=evidence.data.artifacts?.finished_media_qa?.mediaQA?.inspection?.mediaSha256;
  if(!mediaHash||row.media_quality_evidence?.mediaSha256!==mediaHash)continue;
  allAccepted.push(row.id);
 }
 const complete=directCourseComplete({learnerLessonIds,acceptedLessonIds:allAccepted,manifestLessonIds:learnerLessonIds});
 if(complete){
  await assertSource();
  const course=await db.from('courses').select('id,status,is_active,generation_status,generation_progress,total_lessons,metadata,updated_at').eq('id',build.course_id).single();
  if(course.error)throw course.error;
  // An incrementally published shell is not a full seventeen-lesson release.
  // This branch is reached only after every canonical lesson passes above.
  if(directCourseNeedsFinalPublication(course.data,learnerLessonIds.length)){
   const previous=await db.from('course_versions').select('version_number').eq('course_id',build.course_id).order('version_number',{ascending:false}).limit(1).maybeSingle();
   if(previous.error)throw previous.error;
   const number=(previous.data?.version_number??0)+1;
   const version=await db.from('course_versions').insert({course_id:build.course_id,version_number:number,version:number,label:'Direct validated LMS release',is_published:false,created_by:actor,snapshot:{mode:'direct-lms-release',lessonIds:learnerLessonIds,sourceSha:producer,runId}}).select('id').single();
   if(version.error)throw version.error;
   const moduleIds=[...new Set(learnerRows.map(row=>row.module_id).filter(Boolean))];
   if(moduleIds.length){const modules=await db.from('course_version_modules').insert(moduleIds.map(id=>({version_id:version.data.id,module_id:id})));if(modules.error)throw modules.error;}
   const lessons=await db.from('course_version_lessons').insert(learnerLessonIds.map(id=>({version_id:version.data.id,lesson_id:id})));if(lessons.error)throw lessons.error;
   const now=new Date().toISOString();
   const metadata={...(course.data.metadata??{}),manualCompletionAudit:{...(course.data.metadata?.manualCompletionAudit??{}),checked_at:now,published_lessons:allAccepted.length,verified_photographic_lessons:allAccepted.length,full_release_ready:true,current_blocker:null,first_aid_release_hold:null,completedSourceSha:producer,completedRunId:runId}};
   const published=await db.from('courses').update({status:'published',is_active:true,published_at:now,published_by:actor,review_status:'approved',generation_status:'published',generation_progress:100,total_lessons:learnerLessonIds.length,version:number,metadata,updated_at:now}).eq('id',build.course_id).eq('updated_at',course.data.updated_at).select('id,status,is_active');
   if(published.error||published.data?.length!==1)throw published.error??Error('DIRECT_COURSE_CHANGED_BEFORE_PUBLICATION');
   const publishedVersion=await db.from('course_versions').update({is_published:true,published_at:now}).eq('id',version.data.id).select('id');
   if(publishedVersion.error||publishedVersion.data?.length!==1)throw publishedVersion.error??Error('DIRECT_COURSE_SNAPSHOT_PUBLICATION_FAILED');
   const audit=await db.rpc('log_audit_event',{p_actor_user_id:actor,p_entity_type:'course',p_entity_id:build.course_id,p_action:'course_published',p_details:{mode:'direct-lms-release',version_id:version.data.id,lesson_count:allAccepted.length,source_sha:producer,run_id:runId}});
   if(audit.error)throw audit.error;
  }
 }
 console.log(JSON.stringify({courseId:build.course_id,runId,complete,publishedLessonCount:allAccepted.length,newlyVerifiedInThisPass:accepted.length,learnerLessonCount:learnerLessonIds.length,blocked}));
 return {courseId:build.course_id,complete};
}
runDirectCourseSequence({groups:TARGET_GROUPS,execute:main}).catch(error=>{console.error(JSON.stringify({state:'direct-release-stopped',code:safeCode(error)}));process.exitCode=1;});
