import test from 'node:test';import assert from 'node:assert/strict';
import {dispatchLessonAutopilots} from './dispatch-lesson-autopilots.mjs';
import {lessonRoleDefinition,LESSON_ROLE_JOBS} from './deploy-lesson-autopilots.mjs';
const now=new Date('2026-10-27T18:00:00Z');
const source={spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',maxRetries:0,
 containers:[{image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'8',memory:'32Gi'}},env:[]}]}}}}}};
const waiting=role=>({id:'job-'+role,status:'queued',available_at:'2026-10-27T17:59:00Z',attempts:0,max_attempts:5,execution_generation:0,payload:{autopilot:{role}}});
function fixture(rows){
 const calls=[],active=new Map(),templates=new Map(Object.entries(LESSON_ROLE_JOBS).map(([role,c])=>[c.name,lessonRoleDefinition(source,role)]));
 const options={now,clock:()=>now.getTime()+2000,assignmentAttempts:1,delay:async()=>{},env:{SUPABASE_SERVICE_ROLE_KEY:'fixture'},
  run:args=>{
   calls.push(args);
   if(args[2]==='execute'){active.set(args[3],[{status:{}}]);return '';}
   if(args[2]==='describe')return JSON.stringify(args[3]==='elevate-course-builder-parallel'?source:templates.get(args[3]));
   if(args[2]==='executions')return JSON.stringify(active.get(args.find(a=>a.startsWith('--job=')).slice(6))??[]);
   throw Error('unexpected command');
  },
  request:async url=>({ok:true,json:async()=>url.searchParams.has('id')?[{id:url.searchParams.get('id').slice(3),status:'running',lease_owner:'exclusive-worker',lease_expires_at:'2026-10-27T18:05:00Z',heartbeat_at:'2026-10-27T18:00:01Z',execution_generation:1}]:rows}),
  capacityCheck:async()=>({fits:true}),
 };
 return {options,calls,active,templates};
}
test('three different lessons receive their own instruction, media and quality workers with fresh claims',async()=>{
 const s=fixture(['instruction','media','quality'].map(waiting));
 const result=await dispatchLessonAutopilots(s.options);
 assert.equal(result.status,'assigned');assert.equal(result.assignments.length,3);
 assert.deepEqual(new Set(result.assignments.map(a=>a.jobId)),new Set(['job-instruction','job-media','job-quality']));
 assert.equal(s.calls.filter(args=>args[2]==='execute').length,3);
});
test('an empty queue and future prerequisite never launch work',async()=>{
 const s=fixture([]);assert.equal((await dispatchLessonAutopilots(s.options)).status,'empty');assert.equal(s.calls.length,0);
 const future=fixture([{...waiting('media'),available_at:'2026-10-27T18:03:00Z'}]);
 assert.equal((await dispatchLessonAutopilots(future.options)).status,'retry_wait');
 assert.equal(future.calls.some(args=>args[2]==='execute'),false);
});
test('an active role owns its slot and keeps coordination alive',async()=>{
 const row={...waiting('media'),status:'running',lease_expires_at:'2026-10-27T18:05:00Z'};
 const s=fixture([row]);s.active.set(LESSON_ROLE_JOBS.media.name,[{status:{}}]);
 assert.equal((await dispatchLessonAutopilots(s.options)).status,'busy');
 assert.equal(s.calls.some(args=>args[2]==='execute'),false);
});
test('a container launch without a real assignment cannot report started',async()=>{
 const s=fixture([waiting('instruction')]);s.options.request=async url=>({ok:true,json:async()=>url.searchParams.has('id')?[]:[waiting('instruction')]});
 await assert.rejects(dispatchLessonAutopilots(s.options),/ASSIGNMENT_TIMEOUT/);
});
test('a quick cached role completion is verified by a new generation and fresh claim heartbeat',async()=>{
 const s=fixture([waiting('instruction')]);s.options.request=async url=>({ok:true,json:async()=>url.searchParams.has('id')?
  [{id:'job-instruction',status:'completed',execution_generation:1,heartbeat_at:'2026-10-27T18:00:01Z'}]:[waiting('instruction')]});
 assert.equal((await dispatchLessonAutopilots(s.options)).status,'assigned');
});
test('capacity and immutable-image checks remain mandatory for every role',async()=>{
 const s=fixture([waiting('media')]);s.options.capacityCheck=async()=>({fits:false});
 assert.equal((await dispatchLessonAutopilots(s.options)).status,'capacity_wait');assert.equal(s.calls.some(args=>args[2]==='execute'),false);
 s.templates.get(LESSON_ROLE_JOBS.media.name).spec.template.spec.template.spec.containers[0].image='old-image';
 await assert.rejects(dispatchLessonAutopilots(s.options),/APPROVED_TEMPLATE_REQUIRED/);
});
