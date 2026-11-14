import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {scopedCourseQueueUrl} from '../../scripts/gcp/continue-approved-regional-courses.mjs';

const code=stripTypeScriptTypes(readFileSync(new URL('../../lib/gcp/course-worker-launch.ts',import.meta.url),'utf8'))
 .replace(/^import .*;\n/gm,'').replace('export async function','async function');
const requestCourseWorker=new Function('dispatchGoogleDeployment','startDeployedCourseWorker','logger',code+'\nreturn requestCourseWorker;')(
 ()=>{},()=>{}, {warn:()=>{},error:()=>{}}
);

test('successful native Cloud Run launch uses existing job without GitHub duplicate',async()=>{
 let githubCalls=0;
 const result=await requestCourseWorker(async()=>{githubCalls++;return {actionsUrl:'actions'};},async()=>({
   dispatched:true,launchMode:'google-cloud-run',executionVerified:false,operationName:'operations/123'
 }));
 assert.equal(result.dispatched,true);assert.equal(result.executionVerified,false);assert.equal(githubCalls,0);
});
test('native Cloud Run rejection falls back to trusted GitHub dispatch',async()=>{
 const result=await requestCourseWorker(async()=>({actionsUrl:'actions'}),async()=>{throw Error('GOOGLE_SERVICE_IDENTITY_UNAVAILABLE');});
 assert.equal(result.dispatched,true);assert.equal(result.launchMode,'github-workflow');
 assert.equal(result.executionVerified,false);
});
test('neither launch path accepted never claims running or consumes saved course',async()=>{
 for(const message of ['GitHub workflow HTTP 401','Network timeout']){
  const result=await requestCourseWorker(async()=>{throw Error(message);},async()=>{throw Error('GOOGLE_COURSE_JOB_UNAVAILABLE_HTTP_403');});
  assert.equal(result.dispatched,false);assert.equal(result.launchMode,'scheduled');
  assert.equal(result.executionVerified,false);assert.match(result.message,/Scheduled recovery may retry/);
 }
});
test('regional queue preserves dispatcher eligibility without a hard-coded build allowlist',()=>{
 const input='https://database.example/rest/v1/ultimate_build_jobs?or=(status.eq.queued,status.eq.running)&available_at=lte.2026-10-24T12:00:00Z&lease_expires_at=is.null';
 const url=scopedCourseQueueUrl(input);
 assert.equal(url.href,new URL(input).href);
 assert.equal(url.searchParams.get('or'),'(status.eq.queued,status.eq.running)');
 assert.equal(url.searchParams.has('and'),false);
});
