import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {scopedCourseQueueUrl} from '../../scripts/gcp/continue-approved-regional-courses.mjs';
const code=stripTypeScriptTypes(readFileSync(new URL('../../lib/gcp/course-worker-launch.ts',import.meta.url),'utf8'))
 .replace(/^import .*;\n/gm,'').replace('export async function','async function');
const requestCourseWorker=new Function('dispatchGoogleDeployment','logger',code+'\nreturn requestCourseWorker;')(()=>{}, {warn:()=>{}});
test('direct launch acceptance never claims verified execution',async()=>{
 const result=await requestCourseWorker(async()=>({actionsUrl:'actions'}));assert.equal(result.dispatched,true);assert.equal(result.executionVerified,false);
});
test('rejected or unavailable direct launch hands the saved request to the durable coordinator',async()=>{
 for(const message of ['Google GitHub dispatch refused: HTTP 401','Network timeout']){
  const result=await requestCourseWorker(async()=>{throw Error(message);});assert.equal(result.dispatched,false);assert.equal(result.launchMode,'scheduled');
  assert.equal(result.executionVerified,false);assert.match(result.message,/automatic Google dispatcher/);
 }
});
test('regional queue includes existing approved builds and verified administrator requests',()=>{
 const url=scopedCourseQueueUrl('https://database.example/rest/v1/ultimate_build_jobs?or=(status.eq.queued,status.eq.running)');
 assert.equal(url.searchParams.get('or'),'(status.eq.queued,status.eq.running)');
 assert.match(url.searchParams.get('and'),/build_id.in./);assert.match(url.searchParams.get('and'),/payload->>requestedBy.not.is.null/);
});
