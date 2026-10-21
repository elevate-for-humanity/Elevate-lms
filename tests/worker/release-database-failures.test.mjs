import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Exercise the real release service with fault-injected database boundaries.
// Contract validation and media publishing are tested by the existing suites.
const source = readFileSync(new URL('../../lib/ultimate-course-builder/release/release-service.ts', import.meta.url), 'utf8');
const compiled = stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm, '').replace('export class ', 'class '), {mode:'transform'});
const ReleaseService = new Function(compiled + '\nreturn UltimateReleaseService;')();

function scenario(fault) {
 const calls=[];
 const failure=new Error('database unavailable: '+fault);
 const db={from(table){
  let operation='read',selection='',inserted;
  const result=()=>({data:operation==='insert'?{id:'release',...inserted}:null,error:fault===operation?failure:null});
  const q={select(value){selection=value;return q;},eq(){return q;},order(){return q;},limit(){return q;},
   update(){operation=table==='ultimate_release_versions'?'supersede':'course-update';calls.push(operation);return q;},
   insert(value){operation='insert';inserted=value;calls.push('insert');return q;},
   maybeSingle:async()=>{calls.push('version-read');return {data:{version:7},error:fault==='version-read'?failure:null};},
   single:async()=>selection==='*'&&operation==='read'?{data:{id:'previous',build_id:'build',package:{courseId:'course'}},error:null}:result(),
   then(resolve,reject){return Promise.resolve(result()).then(resolve,reject);}};
  return q;
 }};
 const service=new ReleaseService(db);
 service.derive=async()=>({courseId:'course',lessons:[{}]});
 service.applyPackage=async()=>{calls.push('publish-content');return '2026-10-20T00:00:00Z';};
 return {service,calls,failure};
}

for(const action of ['publish','rollback']) {
 test(action+' advances the existing release version after successful persistence',async()=>{
  const {service}=scenario();
  const release=await (action==='publish'?service.publish('build','actor'):service.rollback('course',7,'actor'));
  assert.equal(release.version,8);
  assert.equal(release.status,'released');
  assert.equal(release.released_by,'actor');
 });
 test(action+' fails before publishing content when release history cannot be read',async()=>{
  const {service,calls,failure}=scenario('version-read');
  await assert.rejects(action==='publish'?service.publish('build','actor'):service.rollback('course',7,'actor'),error=>error===failure);
  assert.deepEqual(calls,['version-read']);
 });
 test(action+' does not create a new release after superseding the old release fails',async()=>{
  const {service,calls,failure}=scenario('supersede');
  await assert.rejects(action==='publish'?service.publish('build','actor'):service.rollback('course',7,'actor'),error=>error===failure);
  assert.equal(calls.includes('insert'),false);
 });
}
