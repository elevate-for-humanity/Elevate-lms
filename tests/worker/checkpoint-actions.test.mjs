import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../apps/admin/app/api/admin/ultimate-course-builder/checkpoint/route.ts',import.meta.url),'utf8'),{mode:'transform'})
 .replace(/^import .*;\n/gm,'').replace(/export /g,'');
const buildId='11111111-1111-4111-8111-111111111111',lessonId='22222222-2222-4222-8222-222222222222';
function harness({live=false,published=false,race=false,dispatchFails=false,unauthorized=false}={}){
 const writes=[];let dispatched=0;
 const profile={competencies:[{id:'competency',title:'Lesson title'}]};
 const job={id:'job',status:live?'running':'failed',execution_generation:7,lease_expires_at:live?new Date(Date.now()+60000).toISOString():null,payload:{kept:'saved',lessonRepairCounts:{competency:3,other:2}}};
 const db={from:table=>{
  const query={select:()=>query,eq:(...args)=>{filters.push(args);return query;},or:value=>{filters.push(['or',value]);return query;},order:()=>query,limit:()=>query,
   update:value=>{mutation=value;writes.push({table,value,filters});return query;},single:()=>Promise.resolve(result()),then:resolve=>resolve(result())};
  const filters=[];let mutation;
  function result(){if(mutation)return{data:race?[]:[{id:'job'}]};
   return{data:table==='ultimate_course_builds'?{id:buildId,status:published?'published':'blocked',profile}:
    table==='ultimate_lesson_builds'?{id:lessonId,competency_id:'competency',artifacts:{},status:'built_with_findings'}:
    table==='ultimate_lesson_steps'?[{step:'finished_media_qa',state:'failed',findings:[{step:'finished_media_qa',code:'CAPTION_FAILURE',severity:'error'}]}]:[job]};}
  return query;
 }};
 const response=(body,options={})=>({status:options.status??200,body});
 const api=new Function('NextResponse','apiRequireAdmin','requireAdminClient','ULTIMATE_BUILD_STEPS','validateStepOutput','routeSelectiveRepairs','renderPlaybackUrl','dispatchGoogleDeployment','safeInternalError',source+'\nreturn {GET,POST};')(
  {json:response},async()=>unauthorized?{error:response({error:'Unauthorized'},{status:401})}:{id:'owner'},async()=>db,
  ['standards_lock','lesson_film_render','finished_media_qa','credential_release'],()=>['MISSING_EVIDENCE'],()=>[{step:'lesson_film_render'}],()=>null,
  async()=>{dispatched++;if(dispatchFails)throw Error('DISPATCH_FAILED');},(_e,_context,message)=>response({error:message},{status:500}));
 const input={buildId,lessonBuildId:lessonId,step:'finished_media_qa'};
 return{api,writes,job,input,request:{json:async()=>input,nextUrl:{searchParams:new URLSearchParams(input)}},dispatched:()=>dispatched};
}
test('checkpoint diagnostics report saved failures without mutating or dispatching',async()=>{
 const h=harness();const r=await h.api.GET(h.request);assert.equal(r.status,200);assert.equal(r.body.diagnostic.lessonTitle,'Lesson title');
 assert.equal(r.body.diagnostic.state,'failed');assert.deepEqual(r.body.diagnostic.missingEvidence,['MISSING_EVIDENCE']);assert.equal(h.writes.length,0);assert.equal(h.dispatched(),0);
});
test('unauthenticated, published, and actively leased repairs never write',async()=>{
 for(const options of [{unauthorized:true},{published:true},{live:true}]){const h=harness(options);const r=await h.api.POST(h.request);assert.ok(r.status>=400);assert.equal(h.writes.length,0);assert.equal(h.dispatched(),0);}
});
test('concurrent worker claim fails the conditional repair write before dispatch',async()=>{
 const h=harness({race:true});assert.equal((await h.api.POST(h.request)).status,409);assert.equal(h.dispatched(),0);
 assert.ok(h.writes[0].filters.some(([k,v])=>k==='execution_generation'&&v===7));
 assert.ok(h.writes[0].filters.some(([k])=>k==='or'));
});
test('repair preserves unrelated saved work, resets only this lesson, and routes to the failed producer',async()=>{
 const h=harness();const r=await h.api.POST(h.request);assert.equal(r.status,202);assert.equal(r.body.executionVerified,false);assert.equal(h.dispatched(),1);
 const payload=h.writes[0].value.payload;assert.equal(payload.kept,'saved');assert.deepEqual(payload.lessonRepairCounts,{other:2});
 assert.equal(payload.checkpointRepair.fromStep,'lesson_film_render');assert.equal(h.writes[0].value.execution_generation,8);
});
test('dispatch failure tells the owner the repair is saved without claiming launch success',async()=>{
 const h=harness({dispatchFails:true});const r=await h.api.POST(h.request);assert.equal(r.status,500);assert.match(r.body.error,/Repair was saved/);
});
