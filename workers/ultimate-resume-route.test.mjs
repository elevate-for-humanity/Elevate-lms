import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(await readFile(new URL('../apps/admin/app/api/admin/ultimate-course-builder/run/route.ts',import.meta.url),'utf8'))
 .replace(/^import .*;\n/gm,'').replace(/export /g,'');
function fixture({paused=true,status='blocked',conflict=false,running=false,denied=false}={}){
 const writes=[];let launches=0;
 const profile={ownerPaused:paused,competencies:[{id:'lesson'}],presentationContract:{approvedReferenceVideo:{sha256:'approved-hash'}}};
 const build={id:'572cca43-6bd6-4a91-b385-a8b576209c4e',status,profile};
 const db={from(table){let write,filters=[];const q={
  select(){return q;},eq(k,v){filters.push([k,v]);return q;},in(k,v){filters.push([k,v]);return q;},
  update(value){write=value;return q;},async single(){return {data:build};},
  then(resolve,reject){if(write)writes.push({table,write,filters});return Promise.resolve({data:conflict?[]:[{id:build.id}]}).then(resolve,reject);}
 };return q;}};
 const job={id:'job',status:running?'running':'queued',attempts:0,max_attempts:5,payload:{},
  heartbeat_at:new Date().toISOString(),lease_expires_at:new Date(Date.now()+60000).toISOString()};
 const POST=new Function('NextResponse','apiRequireAdmin','requireAdminClient','UltimateJobQueue','requestCourseWorker','applyRateLimit','safeInternalError',source+'\nreturn POST;')(
  {json:(body,options={})=>({body,status:options.status??200})},
  async()=>denied?{error:{status:403}}:{id:'real-admin'},async()=>db,
  class {async enqueue(){build.status='queued';return job;}},
  async()=>{launches++;return {dispatched:true};},async()=>null,
  (error)=>{throw error;});
 return {writes,profile,launches:()=>launches,call:()=>POST({json:async()=>({buildId:build.id})})};
}
test('explicit Resume clears the hold with real actor and preserves the approved reference',async()=>{
 const f=fixture();const response=await f.call();assert.equal(response.status,202);
 assert.equal(f.writes.length,1);const update=f.writes[0];
 assert.equal(update.write.profile.ownerPaused,false);
 assert.equal(update.write.profile.pauseResumeAudit.resumedBy,'real-admin');
 assert.deepEqual(update.write.profile.presentationContract,f.profile.presentationContract);
 assert.ok(update.filters.some(([k])=>k==='profile'));
 assert.equal(f.launches(),1);
});
test('Resume does not rewrite an unpaused profile',async()=>{
 const f=fixture({paused:false});assert.equal((await f.call()).status,202);assert.equal(f.writes.length,0);
});
test('concurrent profile changes prevent launch',async()=>{
 const f=fixture({conflict:true});assert.equal((await f.call()).status,409);assert.equal(f.launches(),0);
});
test('active leases do not launch duplicate workers or alter profiles',async()=>{
 const f=fixture({running:true});assert.equal((await f.call()).body.alreadyRunning,true);assert.equal(f.writes.length,0);assert.equal(f.launches(),0);
});
test('published and archived revisions cannot be resumed',async()=>{
 for(const status of ['published','archived']){const f=fixture({status});assert.equal((await f.call()).status,409);assert.equal(f.writes.length,0);assert.equal(f.launches(),0);}
});
test('unauthorized callers cannot resume a build',async()=>{
 const f=fixture({denied:true});assert.equal((await f.call()).status,403);assert.equal(f.writes.length,0);assert.equal(f.launches(),0);
});
