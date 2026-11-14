import test from 'node:test';
import assert from 'node:assert/strict';
import {superviseCourseQueue} from './supervise-course-queue.mjs';
const env={GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',SUPABASE_SERVICE_ROLE_KEY:'fixture',GH_TOKEN:'fixture'};
const now=new Date('2026-10-18T14:00:00Z');
function fixture(runs=[]){
 const row={id:'saved-job',status:'running',attempts:1,max_attempts:5,execution_generation:2,lease_owner:'terminated-worker',heartbeat_at:'2026-10-18T13:00:00Z',lease_expires_at:'2026-10-18T13:01:00Z',monitor:{enabled:true},ultimate_course_builds:{status:'running'}};
 const writes=[],dispatches=[];
 const request=async(url,options={})=>{
  if(String(url).includes('api.github.com')){
   if(options.method==='POST'){dispatches.push(JSON.parse(options.body));return {status:204};}
   return {ok:true,json:async()=>({workflow_runs:runs})};
  }
  if(options.method==='PATCH'){const body=JSON.parse(options.body);writes.push(body);Object.assign(row,body);return {ok:true,json:async()=>[row]};}
  return {ok:true,json:async()=>[row]};
 };
 return {row,writes,dispatches,request};
}
test('terminated worker requests replacement and later confirms its real lease without resetting checkpoints',async()=>{
 const f=fixture([{head_branch:'main',status:'completed',conclusion:'failure'}]);
 const result=await superviseCourseQueue({request:f.request,env,now});
 assert.equal(result.status,'dispatch_requested');assert.equal(result.confirmedRecovery,false);
 assert.deepEqual(f.dispatches,[{ref:'main'}]);
 assert.equal(f.row.monitor.state,'dispatch_failed');
 assert.ok(f.writes.every(body=>!('payload' in body)&&!('attempts' in body)&&!('status' in body)));
 Object.assign(f.row,{lease_owner:'replacement-worker',heartbeat_at:'2026-10-18T13:59:59Z',lease_expires_at:'2026-10-18T14:05:00Z'});
 assert.equal((await superviseCourseQueue({request:f.request,env,now})).status,'observed');
 assert.equal(f.row.monitor.state,'running');assert.equal(f.row.monitor.confirmedAssignments,1);
 assert.equal(f.dispatches.length,1);
});
test('active dispatch is observed without replacing its pending runtime operation',async()=>{
 const f=fixture([{head_branch:'main',status:'in_progress'}]);
 assert.equal((await superviseCourseQueue({request:f.request,env,now})).status,'dispatch_pending');
 assert.equal(f.dispatches.length,0);
});
test('an owner pause never requests dispatch',async()=>{
 const f=fixture();f.row.ultimate_course_builds.ownerPaused=true;
 assert.equal((await superviseCourseQueue({request:f.request,env,now})).status,'observed');assert.equal(f.dispatches.length,0);
});
test('failed GitHub handoff cannot count as recovery',async()=>{
 const f=fixture();const request=(url,options)=>options?.method==='POST'?Promise.resolve({status:403}):f.request(url,options);
 await assert.rejects(superviseCourseQueue({request,env,now}),/PARIS_DISPATCH_REQUEST_HTTP_403/);
 assert.equal(f.row.monitor.confirmedAssignments,undefined);
});
