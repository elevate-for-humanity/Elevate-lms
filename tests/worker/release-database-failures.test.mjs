import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Transport fault injection exercises the actual service. Contract validation
// has its own suite; SQL atomicity is tested in the rollback-only DB regression.
const source=readFileSync(new URL('../../lib/ultimate-course-builder/release/release-service.ts',import.meta.url),'utf8');
const compiled=stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,'').replace('export class ','class '),{mode:'transform'});
const ReleaseService=new Function('prepareUltimatePublication',compiled+'\nreturn UltimateReleaseService;')((p,actor)=>{
 if(p.invalid)throw Error('ULTIMATE_RELEASE_CONTRACT_REQUIRED');
 return [{prepared:true,actor}];
});
function scenario({rpcError=null,data=[{id:'release',version:8,status:'released',released_by:'actor'}],readError=null}={}){
 const calls=[];
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data,error:rpcError};},from(table){
  assert.equal(table,'ultimate_release_versions');
  const q={select(){return q;},eq(){return q;},single:async()=>({data:{id:'previous',build_id:'build',package:{courseId:'course'}},error:readError})};
  return q;
 }};
 const service=new ReleaseService(db);service.derive=async()=>({courseId:'course',buildId:'build',lessons:[{}]});
 return {service,calls};
}
for(const action of ['publish','rollback']){
 test(action+' performs one atomic RPC instead of separate live publication writes',async()=>{
  const {service,calls}=scenario();
  const release=await (action==='publish'?service.publish('build','actor'):service.rollback('course',7,'actor'));
  assert.equal(release.version,8);assert.equal(release.status,'released');assert.equal(calls.length,1);
  assert.equal(calls[0].name,'commit_ultimate_release');
  assert.equal(calls[0].args.p_rolled_back_from,action==='rollback'?'previous':null);
 });
 test(action+' propagates a transaction failure without a client-side partial-write fallback',async()=>{
  const error=new Error('atomic transaction rejected');const {service,calls}=scenario({rpcError:error});
  await assert.rejects(action==='publish'?service.publish('build','actor'):service.rollback('course',7,'actor'),e=>e===error);
  assert.equal(calls.length,1);
 });
 test(action+' cannot report success without exactly one durable release row',async()=>{
  const {service}=scenario({data:[]});
  await assert.rejects(action==='publish'?service.publish('build','actor'):service.rollback('course',7,'actor'),/ULTIMATE_RELEASE_NOT_PERSISTED/);
 });
}
test('worker publication carries its execution fence to the database transaction',async()=>{
 const {service,calls}=scenario();const fence={jobId:'job',workerId:'worker',generation:9};
 await service.publish('build','actor',fence);assert.deepEqual(calls[0].args.p_fence,fence);
});
test('contract preparation failure makes no publication request',async()=>{
 const {service,calls}=scenario();service.derive=async()=>({invalid:true});
 await assert.rejects(service.publish('build','actor'),/CONTRACT_REQUIRED/);assert.equal(calls.length,0);
});
test('failed historical release lookup cannot start a rollback transaction',async()=>{
 const error=new Error('history unavailable');const {service,calls}=scenario({readError:error});
 await assert.rejects(service.rollback('course',7,'actor'),e=>e===error);assert.equal(calls.length,0);
});
