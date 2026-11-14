import test from 'node:test';
import assert from 'node:assert/strict';
import {claimExactOwnerPreview} from './owner-preview-claim.mjs';
const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const lesson='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
function fixture(changes={}){
 const row={id,status:'queued',attempts:0,max_attempts:1,execution_generation:80,lease_owner:null,external_execution_id:null,
  available_at:'2026-01-01T00:00:00Z',payload:{ownerPreview:true,lessonBuildId:lesson,competencyId:lesson},...changes};
 const other={...row,id:'cccccccc-cccc-4ccc-cccc-cccccccccccc',status:'running',lease_owner:'existing-worker'};
 const rows=[row,other];
 const db={from(table){assert.equal(table,'ultimate_build_jobs');let update=null;const filters=[];
  const q={select(){return q;},update(value){update=value;return q;},eq(key,value){filters.push(r=>key==='payload'?JSON.stringify(r[key])===value:r[key]===value);return q;},is(key,value){filters.push(r=>r[key]===value);return q;},async maybeSingle(){
   const found=rows.find(r=>filters.every(f=>f(r)));
   if(!found)return {data:null,error:null};
   if(update)Object.assign(found,update);
   return {data:structuredClone(found),error:null};
  }};return q;}};
 return {db,row,other};
}
test('concurrent preview claims permit one owner and never touch the other live job',async()=>{
 const f=fixture();const before=structuredClone(f.other);
 const result=await Promise.all([claimExactOwnerPreview(f.db,id,'preview-one'),claimExactOwnerPreview(f.db,id,'preview-two')]);
 assert.equal(result.filter(Boolean).length,1);assert.equal(f.row.attempts,1);
 assert.equal(f.row.execution_generation,80);assert.deepEqual(f.other,before);
});
for(const [name,changes] of Object.entries({external:{external_execution_id:'modal-receipt'},active:{status:'running',lease_owner:'existing'},ordinary:{payload:{lessonBuildId:lesson,competencyId:lesson}},exhausted:{attempts:1},delayed:{available_at:'2999-01-01T00:00:00Z'}}))
 test(name+' job is preserved rather than reclaimed or reset',async()=>{
  const f=fixture(changes),before=structuredClone(f.row);
  assert.equal(await claimExactOwnerPreview(f.db,id,'preview'),null);assert.deepEqual(f.row,before);
 });
test('invalid target cannot fall back to the ordinary course queue',async()=>{
 const f=fixture();await assert.rejects(()=>claimExactOwnerPreview(f.db,'invalid','preview'),/IDENTITY_REQUIRED/);
 assert.equal(f.row.status,'queued');
});
