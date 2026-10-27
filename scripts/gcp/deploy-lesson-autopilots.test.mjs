import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {lessonRoleDefinition,verifyLessonRoleJob,deployLessonAutopilots} from './deploy-lesson-autopilots.mjs';
const source={spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:'elevate-worker-runtime@elegant-racer-299721.iam.gserviceaccount.com',timeoutSeconds:'10800',maxRetries:0,
 containers:[{image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'8',memory:'32Gi'}},env:[{name:'PRIVATE_FIXTURE',value:'retained-in-memory'},{name:'ULTIMATE_WORKER_ONCE',value:'true'}]}]}}}}}};
test('three permanent role templates retain identity, storage environment and immutable image',()=>{
 const jobs=['instruction','media','quality'].map(role=>lessonRoleDefinition(source,role));
 assert.equal(new Set(jobs.map(job=>job.metadata.name)).size,3);
 for(const [index,job] of jobs.entries()){
  assert.equal(job.spec.template.spec.template.spec.containers[0].env.find(e=>e.name==='ULTIMATE_AUTOPILOT_ROLE').value,['instruction','media','quality'][index]);
  assert.equal(verifyLessonRoleJob(job,job).image,source.spec.template.spec.template.spec.containers[0].image);
 }
 assert.deepEqual(jobs[1].spec.template.spec.template.spec.containers[0].resources.limits,{cpu:'8',memory:'32Gi'});
 assert.equal(jobs.reduce((sum,job)=>sum+Number(job.spec.template.spec.template.spec.containers[0].resources.limits.memory.replace('Gi','')),0),40);
 assert.equal(source.spec.template.spec.template.spec.containers[0].env.some(e=>e.name==='ULTIMATE_AUTOPILOT_ROLE'),false);
});
test('deployment verifies actual roles and removes private temporary configuration',()=>{
 const definitions=new Map(),paths=[];
 const result=deployLessonAutopilots({run:args=>{
  if(args[2]==='replace'){
   const path=args[3];paths.push(path);assert.equal(statSync(path).mode&0o777,0o600);
   const job=JSON.parse(readFileSync(path,'utf8'));definitions.set(job.metadata.name,job);return '';
  }
  return JSON.stringify(args[3]==='elevate-course-builder-parallel'?source:definitions.get(args[3]));
 }});
 assert.equal(result.jobs.length,3);assert.ok(paths.every(path=>!existsSync(path)));
 const wrong=lessonRoleDefinition(source,'quality');wrong.spec.template.spec.template.spec.containers[0].image='wrong';
 assert.throws(()=>verifyLessonRoleJob(wrong,lessonRoleDefinition(source,'quality')),/READBACK_FAILED/);
});
