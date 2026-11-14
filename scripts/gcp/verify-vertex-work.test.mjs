import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {vertexWorkSource,vertexWorkManifest} from './verify-vertex-work.mjs';
test('actual probe accepts a correct generated answer and rejects an HTTP 200 wrong answer',async()=>{
 for(const answer of [4,5]){
  const output=[],process={exitCode:0};let calls=0;
  const request=async(url,options)=>{calls++;if(String(url).startsWith('http://metadata.'))return Response.json({access_token:'private-token'});assert.equal(options.headers.Authorization,'Bearer private-token');return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({answer})}]}}]});};
  await vm.runInNewContext(vertexWorkSource('gemini-test','us'),{fetch:request,process,AbortSignal,console:{log:s=>output.push(JSON.parse(s))}});
  assert.equal(calls,2);assert.equal(output[0].passed,answer===4);assert.equal(process.exitCode,answer===4?0:1);assert.ok(!JSON.stringify(output).includes('private-token'));
 }
});
test('ephemeral proof uses only existing identity/image with bounded compute and no secrets or retries',()=>{
 const args={name:'elevate-vertex-proof-123-1',identity:'elevate-worker@elegant-racer-299721.iam.gserviceaccount.com',image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/course-worker@sha256:'+'a'.repeat(64),model:'gemini-test',location:'us'};
 const task=vertexWorkManifest(args).spec.template.spec.template.spec;
 assert.equal(task.maxRetries,0);assert.equal(task.timeoutSeconds,90);assert.equal(task.containers[0].resources.limits.memory,'512Mi');assert.equal(task.containers[0].env,undefined);
 assert.throws(()=>vertexWorkManifest({...args,image:'unverified:latest'}),/EXISTING_WORKER_REQUIRED/);
 assert.throws(()=>vertexWorkSource('malicious/model','us'),/PROFILE_UNVERIFIED/);
});
