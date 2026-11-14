import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../apps/admin/app/api/admin/ultimate-course-builder/pause/route.ts',import.meta.url),'utf8'))
 .replace(/^import .*;\n/gm,'').replace(/export /g,'');
function fixture({conflict=false,denied=false,revision='2026-10-25T20:00:00.123456+00:00'}={}){
 const writes=[];
 const build={id:'572cca43-6bd6-4a91-b385-a8b576209c4e',status:'running',updated_at:revision,
  profile:{ownerPaused:false,instructionalSources:[{text:'A'.repeat(120000)}],presentationContract:{approvedReferenceVideo:{sha256:'unchanged'}}}};
 const db={from(){let value;const filters=[];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},update(v){value=v;return q;},
  async single(){return {data:build};},then(resolve,reject){writes.push({value,filters});return Promise.resolve({data:conflict?[]:[{id:build.id}]}).then(resolve,reject);}};return q;}};
 const POST=new Function('NextResponse','apiRequireAdmin','requireAdminClient','applyRateLimit','safeInternalError',source+'\nreturn POST;')(
  {json:(body,opts={})=>({body,status:opts.status??200})},async()=>denied?{error:{status:403}}:{id:'real-admin'},async()=>db,async()=>null,e=>{throw e;});
 return {writes,build,call:()=>POST({json:async()=>({buildId:build.id})})};
}
test('large course pause uses a bounded revision filter and preserves every instructional source',async()=>{
 const f=fixture();assert.equal((await f.call()).status,200);
 const {value,filters}=f.writes[0];assert.equal(value.profile.ownerPaused,true);
 assert.deepEqual(value.profile.instructionalSources,f.build.profile.instructionalSources);
 assert.deepEqual(value.profile.presentationContract,f.build.profile.presentationContract);
 assert.equal(value.profile.pauseResumeAudit.pausedBy,'real-admin');
 assert.ok(filters.some(([key,v])=>key==='updated_at'&&v===f.build.updated_at));
 assert.ok(!filters.some(([key])=>key==='profile'));
 assert.ok(JSON.stringify(filters).length<300);
});
test('concurrent changes, missing revision and unauthorized callers cannot save a pause',async()=>{
 for(const opts of [{conflict:true},{revision:null},{denied:true}]){
  const f=fixture(opts);
  assert.equal((await f.call()).status,opts.denied?403:409);
 }
});
